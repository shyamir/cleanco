import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AvailableSlotsQueryDto } from './dto/available-slots-query.dto';
import { SubscriptionAvailabilityQueryDto } from './dto/subscription-availability-query.dto';
import { isBefore, addWeeks, setDay, format } from 'date-fns';
import { ServiceType } from '@prisma/client';
import { DateUtils } from '../../common/utils/date.utils';

@Injectable()
export class TimeSlotsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get available time slots for a specific date
   */
  async getAvailableSlots(query: AvailableSlotsQueryDto) {
    const { date: dateString } = query;

    // Calculate required cleaners based on booking details
    const requiredCleaners = this.calculateRequiredCleaners(query);

    // Parse the date string as Maldives time for consistent date handling
    const requestedDate = DateUtils.parseDateAsMaldives(dateString);
    const today = DateUtils.todayInMaldives();
    const now = DateUtils.nowInMaldives();

    // Check if date is in the past
    if (isBefore(requestedDate, today)) {
      throw new BadRequestException('Cannot book for past dates');
    }

    // Check if this is a same-day booking
    const isToday = format(requestedDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');

    // Check if the date is a Friday (no bookings on Fridays)
    // getDayOfWeekInMaldives returns 0-6 where 5 = Friday
    if (DateUtils.getDayOfWeekInMaldives(requestedDate) === 5) {
      throw new BadRequestException('Bookings are not available on Fridays');
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
        let totalCapacity: number;
        if (cache) {
          totalCapacity = cache.totalCapacity;
        } else {
          // Count cleaners who are available and not on vacation for this date
          totalCapacity = await this.prisma.cleanerProfile.count({
            where: {
              isAvailable: true,
              vacations: {
                none: {
                  startDate: { lte: requestedDate },
                  endDate: { gte: requestedDate },
                },
              },
            },
          });
        }
        const bookedCapacity = cache?.bookedCapacity || bookingCount;
        const availableCapacity = totalCapacity - bookedCapacity;

        return {
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          displayTime: slot.displayStartTime,
          isAvailable: availableCapacity >= requiredCleaners,
          availableCapacity: Math.max(0, availableCapacity),
          requiredCleaners,
        };
      }),
    );

    // For same-day bookings, mark slots less than 6 hours from now as unavailable
    let finalSlots = slotsWithAvailability;
    if (isToday) {
      // Get current time in Maldives timezone as hours and minutes
      const currentTimeInMaldives = DateUtils.formatInMaldives(now, 'HH:mm');
      const [currentHours, currentMinutes] = currentTimeInMaldives.split(':').map(Number);

      // Calculate cutoff time in minutes since midnight (6 hours from now)
      const cutoffMinutes = currentHours * 60 + currentMinutes + 6 * 60;

      finalSlots = slotsWithAvailability.map((slot) => {
        const [slotHours, slotMinutes] = slot.startTime.split(':').map(Number);
        const slotTotalMinutes = slotHours * 60 + slotMinutes;
        const isWithinMinimumNotice = slotTotalMinutes < cutoffMinutes;

        return {
          ...slot,
          isAvailable: isWithinMinimumNotice ? false : slot.isAvailable,
        };
      });
    }

    return {
      date: dateString,
      isBlackoutDate: false,
      availableSlots: finalSlots,
    };
  }

  /**
   * Get available time slots for a subscription across 12 weeks
   * Checks that the slot has enough capacity on each occurrence
   */
  async getSubscriptionAvailability(query: SubscriptionAvailabilityQueryDto) {
    const { startDate: startDateString, dayOfWeek } = query;

    // Calculate required cleaners
    const requiredCleaners = this.calculateRequiredCleanersForSubscription(query);

    // Parse start date as Maldives time for consistent date handling
    const startDate = DateUtils.parseDateAsMaldives(startDateString);
    const today = DateUtils.todayInMaldives();
    const now = DateUtils.nowInMaldives();

    // Check if date is in the past
    if (isBefore(startDate, today)) {
      throw new BadRequestException('Subscription start date cannot be in the past');
    }

    // Check if the selected day is Friday (no bookings on Fridays)
    // dayOfWeek is 0-6 where 5 = Friday
    if (dayOfWeek === 5) {
      throw new BadRequestException('Subscriptions are not available on Fridays');
    }

    // Generate all 12 dates to check (same day of week for 12 weeks)
    const datesToCheck: Date[] = [];
    let currentDate = setDay(startDate, dayOfWeek, { weekStartsOn: 0 });

    // If the calculated date is before the start date, move to next week
    if (isBefore(currentDate, startDate)) {
      currentDate = addWeeks(currentDate, 1);
    }

    // Generate 12 weekly dates, converting each to Maldives time for consistent comparison
    for (let i = 0; i < 12; i++) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      datesToCheck.push(DateUtils.parseDateAsMaldives(dateStr));
      currentDate = addWeeks(currentDate, 1);
    }

    const dateStrings = datesToCheck.map((d) => format(d, 'yyyy-MM-dd'));

    // Check for blackout dates
    const blackoutDates = await this.prisma.blackoutDate.findMany({
      where: {
        date: {
          in: datesToCheck,
        },
      },
    });

    const blackoutDateStrings = blackoutDates.map((bd) =>
      format(bd.date, 'yyyy-MM-dd'),
    );

    // Get all active time slots
    const allTimeSlots = await this.prisma.timeSlot.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
    });

    // For each time slot, check availability across all 12 dates
    const slotsWithAvailability = await Promise.all(
      allTimeSlots.map(async (slot) => {
        const unavailableDates: string[] = [];
        let minCapacity = Infinity;

        for (const date of datesToCheck) {
          const dateStr = format(date, 'yyyy-MM-dd');

          // Skip blackout dates (they're automatically unavailable)
          if (blackoutDateStrings.includes(dateStr)) {
            unavailableDates.push(dateStr);
            minCapacity = 0;
            continue;
          }

          // Count confirmed bookings for this date and time slot
          const bookingCount = await this.prisma.booking.count({
            where: {
              date: date,
              timeSlotId: slot.id,
              status: {
                in: ['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS'],
              },
            },
          });

          // Get or calculate capacity
          const cache = await this.prisma.availabilityCache.findUnique({
            where: {
              date_timeSlotId: {
                date: date,
                timeSlotId: slot.id,
              },
            },
          });

          let totalCapacity: number;
          if (cache) {
            totalCapacity = cache.totalCapacity;
          } else {
            // Count available cleaners not on vacation
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

          const bookedCapacity = cache?.bookedCapacity || bookingCount;
          const availableCapacity = totalCapacity - bookedCapacity;

          minCapacity = Math.min(minCapacity, availableCapacity);

          if (availableCapacity < requiredCleaners) {
            unavailableDates.push(dateStr);
          }
        }

        return {
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          displayTime: slot.displayStartTime,
          isAvailableFor12Weeks: unavailableDates.length === 0,
          unavailableDates:
            unavailableDates.length > 0 ? unavailableDates : undefined,
          availableCapacityMin: Math.max(
            0,
            minCapacity === Infinity ? 0 : minCapacity,
          ),
          requiredCleaners,
        };
      }),
    );

    // Check if the FIRST booking date for this day of week is today (for 6-hour minimum notice)
    const firstBookingDate = datesToCheck[0];
    const firstBookingDateIsToday = format(firstBookingDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');

    // For same-day bookings, mark slots less than 6 hours from now as unavailable
    let finalSlots = slotsWithAvailability;
    if (firstBookingDateIsToday) {
      // Get current time in Maldives timezone as hours and minutes
      const currentTimeInMaldives = DateUtils.formatInMaldives(now, 'HH:mm');
      const [currentHours, currentMinutes] = currentTimeInMaldives.split(':').map(Number);

      // Calculate cutoff time in minutes since midnight (6 hours from now)
      const cutoffMinutes = currentHours * 60 + currentMinutes + 6 * 60;

      finalSlots = slotsWithAvailability.map((slot) => {
        const [slotHours, slotMinutes] = slot.startTime.split(':').map(Number);
        const slotTotalMinutes = slotHours * 60 + slotMinutes;
        const isWithinMinimumNotice = slotTotalMinutes < cutoffMinutes;

        if (isWithinMinimumNotice) {
          // Add today to unavailable dates and mark as not available for 12 weeks
          const firstDateStr = format(firstBookingDate, 'yyyy-MM-dd');
          const updatedUnavailableDates = slot.unavailableDates
            ? [...slot.unavailableDates, firstDateStr]
            : [firstDateStr];

          return {
            ...slot,
            isAvailableFor12Weeks: false,
            unavailableDates: updatedUnavailableDates,
          };
        }

        return slot;
      });
    }

    return {
      startDate: startDateString,
      dayOfWeek,
      datesToCheck: dateStrings,
      blackoutDatesFound: blackoutDateStrings,
      availableSlots: finalSlots,
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

  /**
   * Calculate number of cleaners required based on booking details
   */
  private calculateRequiredCleaners(query: AvailableSlotsQueryDto): number {
    const { serviceType, bedrooms, floors, rooms } = query;

    // Default to 1 if no service type provided
    if (!serviceType) return 1;

    if (serviceType === ServiceType.HOME) {
      if (!bedrooms || bedrooms <= 2) return 1;
      if (bedrooms === 3) return 2;
      if (bedrooms === 4) return 2;
      return 3; // 5+ bedrooms
    }

    if (serviceType === ServiceType.OFFICE) {
      const roomCount = rooms ?? 0;
      const floorCount = floors ?? 1;

      if (roomCount <= 3 && floorCount === 1) return 1;
      if (roomCount <= 6 || floorCount === 2) return 2;
      return 3;
    }

    return 1;
  }

  /**
   * Calculate number of cleaners required for subscription availability
   */
  private calculateRequiredCleanersForSubscription(
    query: SubscriptionAvailabilityQueryDto,
  ): number {
    const { serviceType, bedrooms, floors, rooms } = query;

    // Default to 1 if no service type provided
    if (!serviceType) return 1;

    if (serviceType === ServiceType.HOME) {
      if (!bedrooms || bedrooms <= 2) return 1;
      if (bedrooms === 3) return 2;
      if (bedrooms === 4) return 2;
      return 3; // 5+ bedrooms
    }

    if (serviceType === ServiceType.OFFICE) {
      const roomCount = rooms ?? 0;
      const floorCount = floors ?? 1;

      if (roomCount <= 3 && floorCount === 1) return 1;
      if (roomCount <= 6 || floorCount === 2) return 2;
      return 3;
    }

    return 1;
  }
}
