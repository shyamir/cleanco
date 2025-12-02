import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AvailableSlotsQueryDto } from './dto/available-slots-query.dto';
import { startOfDay, parse, isBefore } from 'date-fns';

@Injectable()
export class TimeSlotsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get available time slots for a specific date
   */
  async getAvailableSlots(query: AvailableSlotsQueryDto) {
    const { date: dateString } = query;

    // Parse the date string
    const requestedDate = parse(dateString, 'yyyy-MM-dd', new Date());
    const today = startOfDay(new Date());

    // Check if date is in the past
    if (isBefore(requestedDate, today)) {
      throw new BadRequestException('Cannot book slots for past dates');
    }

    // Check if the date is a blackout date
    const blackoutDate = await this.prisma.blackoutDate.findUnique({
      where: { date: requestedDate },
    });

    if (blackoutDate) {
      return {
        date: dateString,
        isBlackoutDate: true,
        blackoutReason: blackoutDate.reason,
        availableSlots: [],
      };
    }

    // Get all active time slots
    const allTimeSlots = await this.prisma.timeSlot.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
    });

    // For each time slot, check how many bookings exist
    const slotsWithAvailability = await Promise.all(
      allTimeSlots.map(async (slot) => {
        // Count confirmed bookings for this date and time slot
        const bookingCount = await this.prisma.booking.count({
          where: {
            date: requestedDate,
            timeSlotId: slot.id,
            status: {
              in: ['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS'],
            },
          },
        });

        // Check availability cache for cleaner capacity (if exists)
        const cache = await this.prisma.availabilityCache.findUnique({
          where: {
            date_timeSlotId: {
              date: requestedDate,
              timeSlotId: slot.id,
            },
          },
        });

        // Calculate available capacity
        // If no cache exists, assume default capacity of 10 cleaners
        const totalCapacity = cache?.totalCapacity || 10;
        const bookedCapacity = cache?.bookedCapacity || bookingCount;
        const availableCapacity = totalCapacity - bookedCapacity;

        return {
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          displayTime: slot.displayStartTime,
          isAvailable: availableCapacity > 0,
          availableCapacity: Math.max(0, availableCapacity),
        };
      }),
    );

    return {
      date: dateString,
      isBlackoutDate: false,
      availableSlots: slotsWithAvailability,
    };
  }

  /**
   * Get all time slots (for admin)
   */
  async findAll() {
    return this.prisma.timeSlot.findMany({
      orderBy: { orderIndex: 'asc' },
    });
  }

  /**
   * Get a single time slot by ID
   */
  async findOne(id: string) {
    const timeSlot = await this.prisma.timeSlot.findUnique({
      where: { id },
    });

    if (!timeSlot) {
      throw new BadRequestException('Time slot not found');
    }

    return timeSlot;
  }
}
