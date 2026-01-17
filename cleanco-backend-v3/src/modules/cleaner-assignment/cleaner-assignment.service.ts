import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BookingLockService } from '../../common/services/booking-lock.service';
import { ServiceType } from '@prisma/client';

@Injectable()
export class CleanerAssignmentService {
  private readonly logger = new Logger(CleanerAssignmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly bookingLockService: BookingLockService,
  ) {}

  /**
   * Auto-assign cleaners to a booking based on business rules
   */
  async autoAssignCleaners(bookingId: string): Promise<void> {
    // Get booking details
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        address: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Calculate required number of cleaners
    const requiredCleaners = this.calculateRequiredCleaners(booking);
    const dateStr = booking.date.toISOString().split('T')[0];

    this.logger.log(
      `=== Auto-assigning ${booking.bookingNumber} (date=${dateStr}, timeSlot=${booking.timeSlotId}, status=${booking.status}) - requires ${requiredCleaners} cleaner(s) ===`,
    );

    // Find available cleaners
    const availableCleaners = await this.findAvailableCleaners(
      booking.date,
      booking.timeSlotId,
      requiredCleaners,
    );

    if (availableCleaners.length < requiredCleaners) {
      this.logger.warn(
        `Not enough available cleaners for booking ${booking.bookingNumber}. ` +
          `Required: ${requiredCleaners}, Available: ${availableCleaners.length}`,
      );
      // Don't throw error - booking can remain in CONFIRMED status until manual assignment
      return;
    }

    // Assign cleaners to booking
    await this.assignCleanersToBooking(bookingId, availableCleaners);

    // Only update status to ASSIGNED if not pending inspection
    // Office bookings stay in PENDING_INSPECTION until admin confirms price
    if (booking.status !== 'PENDING_INSPECTION') {
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'ASSIGNED' },
      });
    }

    this.logger.log(
      `Successfully assigned ${availableCleaners.length} cleaner(s) to booking ${booking.bookingNumber}`,
    );
  }

  /**
   * Calculate required number of cleaners based on service type and size
   */
  private calculateRequiredCleaners(booking: any): number {
    if (booking.serviceType === ServiceType.HOME) {
      const bedrooms = booking.bedrooms || 0;

      if (bedrooms <= 2) {
        return this.configService.get<number>('cleaners.for1Bedroom', 1);
      } else if (bedrooms === 3) {
        return this.configService.get<number>('cleaners.for3Bedroom', 2);
      } else if (bedrooms === 4) {
        return this.configService.get<number>('cleaners.for4Bedroom', 2);
      } else {
        // 4+ bedrooms
        return this.configService.get<number>('cleaners.for4BedroomMax', 3);
      }
    } else if (booking.serviceType === ServiceType.OFFICE) {
      const rooms = booking.rooms || 0;
      const floors = booking.floors || 1;

      // For offices, assign based on total rooms and floors
      if (rooms <= 3 && floors === 1) {
        return 1;
      } else if (rooms <= 6 || floors === 2) {
        return 2;
      } else {
        return 3;
      }
    }

    return 1; // Default
  }

  /**
   * Find available cleaners for a specific date and time slot
   */
  private async findAvailableCleaners(
    date: Date,
    timeSlotId: string,
    requiredCount: number,
  ): Promise<Array<{ id: string; userId: string; workload: number }>> {
    const dateStr = date.toISOString().split('T')[0];
    this.logger.log(
      `Finding ${requiredCount} available cleaners for date=${dateStr}, timeSlotId=${timeSlotId}`,
    );

    // Get all active cleaner profiles
    const cleanerProfiles = await this.prisma.cleanerProfile.findMany({
      where: {
        isAvailable: true,
        user: {
          isActive: true,
          role: 'CLEANER',
        },
      },
      include: {
        user: true,
        vacations: {
          where: {
            startDate: { lte: date },
            endDate: { gte: date },
          },
        },
        assignments: {
          where: {
            booking: {
              date: date,
              timeSlotId: timeSlotId,
              status: {
                in: ['CONFIRMED', 'ASSIGNED', 'IN_PROGRESS'],
              },
            },
          },
          include: {
            booking: {
              select: {
                id: true,
                bookingNumber: true,
                date: true,
                status: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(`Found ${cleanerProfiles.length} total active cleaner profiles`);

    // Filter out cleaners on vacation
    const availableCleaners = cleanerProfiles.filter(
      (cleaner) => cleaner.vacations.length === 0,
    );

    this.logger.log(`${availableCleaners.length} cleaners not on vacation`);

    // Calculate workload for each cleaner (number of assignments on that date/time)
    const cleanersWithWorkload = availableCleaners.map((cleaner) => {
      const workload = cleaner.assignments.length;
      if (workload > 0) {
        const assignmentDetails = cleaner.assignments.map(
          (a: any) =>
            `booking=${a.booking.bookingNumber}, date=${a.booking.date?.toISOString?.().split('T')[0] || a.booking.date}, status=${a.booking.status}`,
        );
        this.logger.log(
          `Cleaner ${cleaner.user.firstName} has ${workload} assignments: [${assignmentDetails.join('; ')}]`,
        );
      }
      return {
        id: cleaner.id,
        userId: cleaner.userId,
        workload,
        name: `${cleaner.user.firstName} ${cleaner.user.lastName}`,
      };
    });

    // Sort by workload (ascending) to balance assignments
    cleanersWithWorkload.sort((a, b) => a.workload - b.workload);

    // Filter out cleaners who are already assigned to another booking at this time slot
    // Strict 1:1 - a cleaner can only be at one place at a time
    const availableForAssignment = cleanersWithWorkload.filter(
      (c) => c.workload === 0,
    );

    this.logger.log(
      `${availableForAssignment.length} cleaners available for assignment (workload=0): [${availableForAssignment.map((c) => c.name).join(', ')}]`,
    );

    // Return the required number of cleaners with lowest workload
    return availableForAssignment.slice(0, requiredCount);
  }

  /**
   * Assign selected cleaners to a booking
   */
  private async assignCleanersToBooking(
    bookingId: string,
    cleaners: Array<{ id: string; userId: string }>,
  ): Promise<void> {
    // Create cleaner assignments in a transaction
    await this.prisma.$transaction(
      cleaners.map((cleaner) =>
        this.prisma.cleanerAssignment.create({
          data: {
            bookingId: bookingId,
            cleanerId: cleaner.id,
            status: 'ASSIGNED',
          },
        }),
      ),
    );
  }

  /**
   * Manually assign cleaners to a booking (admin function)
   */
  async manuallyAssignCleaners(
    bookingId: string,
    cleanerIds: string[],
  ): Promise<void> {
    // Verify booking exists
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Verify all cleaners exist and are available, including conflict checks
    const cleaners = await this.prisma.cleanerProfile.findMany({
      where: {
        id: { in: cleanerIds },
        isAvailable: true,
        user: {
          isActive: true,
          role: 'CLEANER',
        },
      },
      include: {
        user: true,
        // Check for conflicting assignments at the same date/time slot
        assignments: {
          where: {
            booking: {
              date: booking.date,
              timeSlotId: booking.timeSlotId,
              status: { in: ['CONFIRMED', 'ASSIGNED', 'IN_PROGRESS'] },
              id: { not: bookingId }, // Exclude current booking
            },
          },
        },
        // Check for vacations on this date
        vacations: {
          where: {
            startDate: { lte: booking.date },
            endDate: { gte: booking.date },
          },
        },
      },
    });

    if (cleaners.length !== cleanerIds.length) {
      throw new BadRequestException('One or more cleaners not found or inactive');
    }

    // Check for conflicts - cleaner already assigned to another booking at this time
    const conflictingCleaners = cleaners.filter((c) => c.assignments.length > 0);
    if (conflictingCleaners.length > 0) {
      const names = conflictingCleaners
        .map((c) => `${c.user?.firstName || ''} ${c.user?.lastName || ''}`.trim() || 'Unknown')
        .join(', ');
      throw new BadRequestException(
        `The following cleaner(s) are already assigned to another booking at this time: ${names}`,
      );
    }

    // Check for vacations
    const vacationingCleaners = cleaners.filter((c) => c.vacations.length > 0);
    if (vacationingCleaners.length > 0) {
      const names = vacationingCleaners
        .map((c) => `${c.user?.firstName || ''} ${c.user?.lastName || ''}`.trim() || 'Unknown')
        .join(', ');
      throw new BadRequestException(
        `The following cleaner(s) are on vacation on this date: ${names}`,
      );
    }

    // Count current assignments for this booking
    const currentAssignmentCount = await this.prisma.cleanerAssignment.count({
      where: { bookingId },
    });

    const newAssignmentCount = cleanerIds.length;
    const delta = newAssignmentCount - currentAssignmentCount;

    // Check for active holds BEFORE making changes if we're adding cleaners
    if (delta > 0) {
      const availability = await this.bookingLockService.checkSlotAvailability(
        booking.date,
        booking.timeSlotId,
        delta,
      );

      if (!availability.available && availability.heldCapacity > 0) {
        throw new BadRequestException(
          `Cannot add ${delta} cleaner(s) - ${availability.heldCapacity} slot(s) currently held by user(s) at checkout. ` +
            `Please try again in a few minutes after the hold expires.`,
        );
      }

      if (!availability.available) {
        throw new BadRequestException(
          `Cannot add ${delta} cleaner(s) - only ${availability.availableCapacity} slot(s) available.`,
        );
      }
    }

    // Remove existing assignments
    await this.prisma.cleanerAssignment.deleteMany({
      where: { bookingId },
    });

    // Create new assignments
    await this.assignCleanersToBooking(
      bookingId,
      cleaners.map((c) => ({ id: c.id, userId: c.userId })),
    );

    // Update availability cache if the number of cleaners changed
    if (delta !== 0) {
      try {
        if (delta > 0) {
          // More cleaners assigned - reserve additional capacity
          await this.bookingLockService.reserveSlot({
            date: booking.date,
            timeSlotId: booking.timeSlotId,
            requiredCapacity: delta,
          });
        } else {
          // Fewer cleaners assigned - release capacity
          await this.bookingLockService.releaseSlot({
            date: booking.date,
            timeSlotId: booking.timeSlotId,
            requiredCapacity: Math.abs(delta),
          });
        }
        this.logger.log(
          `Updated availability cache: delta=${delta} for date=${booking.date.toISOString().split('T')[0]}, timeSlotId=${booking.timeSlotId}`,
        );
      } catch (error) {
        this.logger.error(`Failed to update availability cache: ${error.message}`);
        // Cache update failed but assignment already done - this shouldn't happen
        // since we check holds upfront, but log for debugging
      }
    }

    // Only update status to ASSIGNED if not pending inspection
    // Office bookings stay in PENDING_INSPECTION until admin confirms price
    if (booking.status !== 'PENDING_INSPECTION') {
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'ASSIGNED' },
      });
    }

    this.logger.log(
      `Manually assigned ${cleaners.length} cleaner(s) to booking ${booking.bookingNumber}`,
    );
  }

  /**
   * Get assigned cleaners for a booking
   */
  async getAssignedCleaners(bookingId: string) {
    const assignments = await this.prisma.cleanerAssignment.findMany({
      where: { bookingId },
      include: {
        cleaner: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return assignments.map((assignment) => ({
      assignmentId: assignment.id,
      cleanerId: assignment.cleanerId,
      status: assignment.status,
      assignedAt: assignment.assignedAt,
      completedAt: assignment.completedAt,
      cleaner: {
        ...assignment.cleaner,
        user: assignment.cleaner.user,
      },
    }));
  }

  /**
   * Remove cleaner assignment
   */
  async removeCleanerAssignment(assignmentId: string): Promise<void> {
    const assignment = await this.prisma.cleanerAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        booking: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    await this.prisma.cleanerAssignment.delete({
      where: { id: assignmentId },
    });

    // Release capacity in availability cache
    try {
      await this.bookingLockService.releaseSlot({
        date: assignment.booking.date,
        timeSlotId: assignment.booking.timeSlotId,
        requiredCapacity: 1, // One cleaner removed
      });
      this.logger.log(
        `Released 1 capacity for date=${assignment.booking.date.toISOString().split('T')[0]}, timeSlotId=${assignment.booking.timeSlotId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to release capacity: ${error.message}`);
      // Don't throw - the removal was successful, cache update is secondary
    }

    this.logger.log(`Removed cleaner assignment ${assignmentId}`);
  }

  /**
   * Re-assign cleaners when booking is rescheduled
   * @param bookingId - The booking ID
   * @param cleanerCount - Optional: Number of cleaners to assign (preserves manual admin adjustments)
   */
  async reassignOnReschedule(bookingId: string, cleanerCount?: number): Promise<void> {
    // Remove existing assignments
    await this.prisma.cleanerAssignment.deleteMany({
      where: { bookingId },
    });

    // Auto-assign new cleaners for the new date/time
    // Use provided count if specified (preserves admin's manual cleaner count changes)
    if (cleanerCount !== undefined && cleanerCount > 0) {
      await this.autoAssignCleanersWithCount(bookingId, cleanerCount);
    } else {
      await this.autoAssignCleaners(bookingId);
    }
  }

  /**
   * Auto-assign a specific number of cleaners to a booking
   * Used when preserving manual admin adjustments during reschedule
   */
  async autoAssignCleanersWithCount(bookingId: string, cleanerCount: number): Promise<void> {
    // Get booking details
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        address: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    this.logger.log(
      `Booking ${booking.bookingNumber} requires ${cleanerCount} cleaner(s) (preserving manual count)`,
    );

    // Find available cleaners
    const availableCleaners = await this.findAvailableCleaners(
      booking.date,
      booking.timeSlotId,
      cleanerCount,
    );

    if (availableCleaners.length < cleanerCount) {
      this.logger.warn(
        `Not enough available cleaners for booking ${booking.bookingNumber}. ` +
          `Required: ${cleanerCount}, Available: ${availableCleaners.length}`,
      );
      // Don't throw error - booking can remain for manual assignment
      return;
    }

    // Assign cleaners to booking
    await this.assignCleanersToBooking(bookingId, availableCleaners);

    // Only update status to ASSIGNED if not pending inspection
    if (booking.status !== 'PENDING_INSPECTION') {
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'ASSIGNED' },
      });
    }

    this.logger.log(
      `Successfully assigned ${availableCleaners.length} cleaner(s) to booking ${booking.bookingNumber}`,
    );
  }
}
