import {
  Injectable,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, SlotHold } from '@prisma/client';

export interface SlotHoldParams {
  userId: string;
  holdGroupId: string;
  date: Date;
  timeSlotId: string;
  capacity: number;
}

@Injectable()
export class SlotHoldService {
  private readonly logger = new Logger(SlotHoldService.name);
  private readonly HOLD_DURATION_MINUTES = 5;

  constructor(private prisma: PrismaService) {}

  /**
   * Create a hold for a single slot
   * Checks availability including existing holds
   */
  async createHold(params: SlotHoldParams): Promise<SlotHold> {
    const { userId, holdGroupId, date, timeSlotId, capacity } = params;
    const expiresAt = new Date(Date.now() + this.HOLD_DURATION_MINUTES * 60 * 1000);

    return this.prisma.$transaction(
      async (tx) => {
        // Check availability (bookings + active holds)
        const available = await this.checkSlotAvailabilityInTx(
          tx,
          date,
          timeSlotId,
          capacity,
        );

        if (!available) {
          throw new ConflictException('This time slot is no longer available');
        }

        // Create the hold
        return tx.slotHold.create({
          data: {
            userId,
            holdGroupId,
            date,
            timeSlotId,
            capacity,
            expiresAt,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10000,
      },
    );
  }

  /**
   * Create holds for multiple slots atomically (for subscriptions)
   * All-or-nothing: if any slot unavailable, no holds created
   */
  async createMultipleHolds(params: {
    userId: string;
    holdGroupId: string;
    slots: Array<{ date: Date; timeSlotId: string; capacity: number }>;
  }): Promise<SlotHold[]> {
    const { userId, holdGroupId, slots } = params;
    const expiresAt = new Date(Date.now() + this.HOLD_DURATION_MINUTES * 60 * 1000);

    if (slots.length === 0) {
      return [];
    }

    return this.prisma.$transaction(
      async (tx) => {
        // Check all slots first
        for (const slot of slots) {
          const available = await this.checkSlotAvailabilityInTx(
            tx,
            slot.date,
            slot.timeSlotId,
            slot.capacity,
          );

          if (!available) {
            const dateStr = slot.date.toISOString().split('T')[0];
            throw new ConflictException(
              `Time slot on ${dateStr} is no longer available`,
            );
          }
        }

        // Create all holds
        const holds: SlotHold[] = [];
        for (const slot of slots) {
          const hold = await tx.slotHold.create({
            data: {
              userId,
              holdGroupId,
              date: slot.date,
              timeSlotId: slot.timeSlotId,
              capacity: slot.capacity,
              expiresAt,
            },
          });
          holds.push(hold);
        }

        return holds;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 30000, // 30 seconds for subscription batches
      },
    );
  }

  /**
   * Check slot availability including booked and held capacity
   */
  private async checkSlotAvailabilityInTx(
    tx: Prisma.TransactionClient,
    date: Date,
    timeSlotId: string,
    requiredCapacity: number,
  ): Promise<boolean> {
    // Get booked capacity from cache
    const cache = await tx.availabilityCache.findUnique({
      where: {
        date_timeSlotId: { date, timeSlotId },
      },
    });

    const bookedCapacity = cache?.bookedCapacity ?? 0;
    let totalCapacity = cache?.totalCapacity ?? 0;

    // If no cache, calculate total capacity from available cleaners
    if (!cache) {
      totalCapacity = await tx.cleanerProfile.count({
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

    // Sum active holds for this slot (excluding expired)
    const activeHoldsSum = await tx.slotHold.aggregate({
      where: {
        date,
        timeSlotId,
        expiresAt: { gt: new Date() },
      },
      _sum: { capacity: true },
    });

    const heldCapacity = activeHoldsSum._sum.capacity ?? 0;
    const availableCapacity = totalCapacity - bookedCapacity - heldCapacity;

    return availableCapacity >= requiredCapacity;
  }

  /**
   * Get available capacity for a slot (including holds)
   */
  async getSlotAvailability(
    date: Date,
    timeSlotId: string,
  ): Promise<{
    totalCapacity: number;
    bookedCapacity: number;
    heldCapacity: number;
    availableCapacity: number;
    isAvailable: boolean;
  }> {
    const cache = await this.prisma.availabilityCache.findUnique({
      where: {
        date_timeSlotId: { date, timeSlotId },
      },
    });

    const bookedCapacity = cache?.bookedCapacity ?? 0;
    let totalCapacity = cache?.totalCapacity ?? 0;

    if (!cache) {
      totalCapacity = await this.prisma.cleanerProfile.count({
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

    const activeHoldsSum = await this.prisma.slotHold.aggregate({
      where: {
        date,
        timeSlotId,
        expiresAt: { gt: new Date() },
      },
      _sum: { capacity: true },
    });

    const heldCapacity = activeHoldsSum._sum.capacity ?? 0;
    const availableCapacity = totalCapacity - bookedCapacity - heldCapacity;

    return {
      totalCapacity,
      bookedCapacity,
      heldCapacity,
      availableCapacity,
      isAvailable: availableCapacity > 0,
    };
  }

  /**
   * Release holds by holdGroupId
   */
  async releaseHolds(holdGroupId: string): Promise<number> {
    const result = await this.prisma.slotHold.deleteMany({
      where: { holdGroupId },
    });
    return result.count;
  }

  /**
   * Get remaining hold time for a session
   */
  async getHoldTimeRemaining(holdGroupId: string): Promise<number | null> {
    const hold = await this.prisma.slotHold.findFirst({
      where: { holdGroupId },
      orderBy: { expiresAt: 'asc' },
    });

    if (!hold) return null;

    const remaining = Math.floor((hold.expiresAt.getTime() - Date.now()) / 1000);
    return Math.max(0, remaining);
  }

  /**
   * Check if a hold group is still valid (not expired)
   */
  async isHoldValid(holdGroupId: string): Promise<boolean> {
    const remaining = await this.getHoldTimeRemaining(holdGroupId);
    return remaining !== null && remaining > 0;
  }

  /**
   * Cleanup expired holds - runs every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async cleanupExpiredHolds(): Promise<void> {
    try {
      const result = await this.prisma.slotHold.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });

      if (result.count > 0) {
        this.logger.log(`Cleaned up ${result.count} expired slot holds`);
      }

      // Also expire checkout sessions
      const sessionsResult = await this.prisma.checkoutSession.updateMany({
        where: {
          status: 'PENDING',
          expiresAt: { lt: new Date() },
        },
        data: { status: 'EXPIRED' },
      });

      if (sessionsResult.count > 0) {
        this.logger.log(`Expired ${sessionsResult.count} checkout sessions`);
      }
    } catch (error) {
      this.logger.error(`Error cleaning up expired holds: ${error}`);
    }
  }
}
