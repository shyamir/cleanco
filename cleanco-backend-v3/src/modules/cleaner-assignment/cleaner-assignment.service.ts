import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ServiceType } from '@prisma/client';

@Injectable()
export class CleanerAssignmentService {
  private readonly logger = new Logger(CleanerAssignmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
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

    this.logger.log(
      `Booking ${booking.bookingNumber} requires ${requiredCleaners} cleaner(s)`,
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
        },
      },
    });

    // Filter out cleaners on vacation
    const availableCleaners = cleanerProfiles.filter(
      (cleaner) => cleaner.vacations.length === 0,
    );

    // Calculate workload for each cleaner (number of assignments on that date/time)
    const cleanersWithWorkload = availableCleaners.map((cleaner) => ({
      id: cleaner.id,
      userId: cleaner.userId,
      workload: cleaner.assignments.length,
    }));

    // Sort by workload (ascending) to balance assignments
    cleanersWithWorkload.sort((a, b) => a.workload - b.workload);

    // Filter out cleaners who are already fully booked
    // Assuming max 3 bookings per cleaner per time slot
    const maxBookingsPerSlot = 3;
    const availableForAssignment = cleanersWithWorkload.filter(
      (c) => c.workload < maxBookingsPerSlot,
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

    // Verify all cleaners exist and are available
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
      },
    });

    if (cleaners.length !== cleanerIds.length) {
      throw new BadRequestException('One or more cleaners not found or inactive');
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
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    await this.prisma.cleanerAssignment.delete({
      where: { id: assignmentId },
    });

    this.logger.log(`Removed cleaner assignment ${assignmentId}`);
  }

  /**
   * Re-assign cleaners when booking is rescheduled
   */
  async reassignOnReschedule(bookingId: string): Promise<void> {
    // Remove existing assignments
    await this.prisma.cleanerAssignment.deleteMany({
      where: { bookingId },
    });

    // Auto-assign new cleaners for the new date/time
    await this.autoAssignCleaners(bookingId);
  }
}
