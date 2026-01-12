import {
  Injectable,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface SlotReservation {
  date: Date;
  timeSlotId: string;
  requiredCapacity: number;
}

@Injectable()
export class BookingLockService {
  private readonly logger = new Logger(BookingLockService.name);
  private readonly MAX_RETRIES = 3;

  constructor(private prisma: PrismaService) {}

  /**
   * Reserve capacity for a single slot atomically
   * Uses pessimistic locking with SELECT FOR UPDATE
   */
  async reserveSlot(reservation: SlotReservation): Promise<void> {
    const { date, timeSlotId, requiredCapacity } = reservation;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        await this.prisma.$transaction(
          async (tx) => {
            // Lock the availability cache row for update
            const cache = await tx.$queryRaw<
              Array<{
                id: string;
                totalCapacity: number;
                bookedCapacity: number;
                version: number;
              }>
            >`
              SELECT id, "totalCapacity", "bookedCapacity", version
              FROM availability_caches
              WHERE date = ${date}::date AND "timeSlotId" = ${timeSlotId}
              FOR UPDATE
            `;

            if (cache.length === 0) {
              // Create new cache entry with reservation
              const totalCapacity = await this.getAvailableCleanersCount(tx, date);

              if (totalCapacity < requiredCapacity) {
                throw new ConflictException('Insufficient capacity for this time slot');
              }

              await tx.availabilityCache.create({
                data: {
                  date,
                  timeSlotId,
                  totalCapacity,
                  bookedCapacity: requiredCapacity,
                  version: 1,
                },
              });
            } else {
              const currentCache = cache[0];
              const availableCapacity = currentCache.totalCapacity - currentCache.bookedCapacity;

              if (availableCapacity < requiredCapacity) {
                throw new ConflictException('This time slot is no longer available');
              }

              // Atomic update with version check
              const updated = await tx.availabilityCache.updateMany({
                where: {
                  id: currentCache.id,
                  version: currentCache.version,
                },
                data: {
                  bookedCapacity: currentCache.bookedCapacity + requiredCapacity,
                  version: { increment: 1 },
                },
              });

              if (updated.count === 0) {
                throw new Error('OPTIMISTIC_LOCK_FAILURE');
              }
            }
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            timeout: 10000,
          },
        );

        return; // Success
      } catch (error: any) {
        if (error.message === 'OPTIMISTIC_LOCK_FAILURE' && attempt < this.MAX_RETRIES) {
          this.logger.warn(
            `Optimistic lock conflict, retrying (${attempt}/${this.MAX_RETRIES})`,
          );
          await this.delay(50 * attempt); // Exponential backoff
          continue;
        }
        throw error;
      }
    }
  }

  /**
   * Reserve capacity for multiple slots atomically (for subscriptions)
   * All reservations succeed or all fail
   */
  async reserveMultipleSlots(reservations: SlotReservation[]): Promise<void> {
    if (reservations.length === 0) {
      return;
    }

    // Group reservations by date+timeSlot to handle duplicates
    const grouped = this.groupReservations(reservations);

    await this.prisma.$transaction(
      async (tx) => {
        for (const [key, totalRequired] of grouped.entries()) {
          const [dateStr, timeSlotId] = key.split('|');
          const date = new Date(dateStr);

          // Lock and check each slot
          const cache = await tx.$queryRaw<
            Array<{
              id: string;
              totalCapacity: number;
              bookedCapacity: number;
              version: number;
            }>
          >`
            SELECT id, "totalCapacity", "bookedCapacity", version
            FROM availability_caches
            WHERE date = ${date}::date AND "timeSlotId" = ${timeSlotId}
            FOR UPDATE
          `;

          let totalCapacity: number;
          let bookedCapacity: number;

          if (cache.length === 0) {
            totalCapacity = await this.getAvailableCleanersCount(tx, date);
            bookedCapacity = 0;
          } else {
            totalCapacity = cache[0].totalCapacity;
            bookedCapacity = cache[0].bookedCapacity;
          }

          const availableCapacity = totalCapacity - bookedCapacity;

          if (availableCapacity < totalRequired) {
            const dateFormatted = date.toISOString().split('T')[0];
            throw new ConflictException(
              `Insufficient capacity on ${dateFormatted} for the selected time slot. ` +
                `Required: ${totalRequired}, Available: ${availableCapacity}`,
            );
          }

          // Update or create cache
          if (cache.length === 0) {
            await tx.availabilityCache.create({
              data: {
                date,
                timeSlotId,
                totalCapacity,
                bookedCapacity: totalRequired,
                version: 1,
              },
            });
          } else {
            await tx.availabilityCache.update({
              where: { id: cache[0].id },
              data: {
                bookedCapacity: bookedCapacity + totalRequired,
                version: { increment: 1 },
              },
            });
          }
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 30000, // 30 second timeout for subscription batches
      },
    );
  }

  /**
   * Release reserved capacity (for rollback on failure or cancellation)
   */
  async releaseSlot(reservation: SlotReservation): Promise<void> {
    const { date, timeSlotId, requiredCapacity } = reservation;

    try {
      await this.prisma.$transaction(
        async (tx) => {
          // Lock the row for update
          const cache = await tx.$queryRaw<
            Array<{
              id: string;
              bookedCapacity: number;
            }>
          >`
            SELECT id, "bookedCapacity"
            FROM availability_caches
            WHERE date = ${date}::date AND "timeSlotId" = ${timeSlotId}
            FOR UPDATE
          `;

          if (cache.length > 0) {
            const newBookedCapacity = Math.max(0, cache[0].bookedCapacity - requiredCapacity);
            await tx.availabilityCache.update({
              where: { id: cache[0].id },
              data: {
                bookedCapacity: newBookedCapacity,
                version: { increment: 1 },
              },
            });
          }
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          timeout: 10000,
        },
      );
    } catch (error) {
      // Log but don't throw - release is best-effort cleanup
      this.logger.error(`Failed to release slot: ${error}`);
    }
  }

  /**
   * Group reservations by date+timeSlot to sum up required capacity
   */
  private groupReservations(reservations: SlotReservation[]): Map<string, number> {
    const grouped = new Map<string, number>();

    for (const res of reservations) {
      const key = `${res.date.toISOString().split('T')[0]}|${res.timeSlotId}`;
      const current = grouped.get(key) || 0;
      grouped.set(key, current + res.requiredCapacity);
    }

    return grouped;
  }

  /**
   * Get count of available cleaners for a date
   */
  private async getAvailableCleanersCount(tx: any, date: Date): Promise<number> {
    return tx.cleanerProfile.count({
      where: {
        isAvailable: true,
        vacations: {
          none: {
            startDate: { lte: date },
            endDate: { gte: date },
          },
        },
      },
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
