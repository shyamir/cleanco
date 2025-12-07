import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CleanerAssignmentService } from '../cleaner-assignment/cleaner-assignment.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RescheduleBookingDto } from './dto/reschedule-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { ServiceType, BookingType, BookingStatus } from '@prisma/client';
import { nanoid } from 'nanoid';
import { parse, isBefore, startOfDay, differenceInHours } from 'date-fns';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private prisma: PrismaService,
    private cleanerAssignmentService: CleanerAssignmentService,
  ) {}

  /**
   * Create a new booking
   */
  async create(userId: string, createBookingDto: CreateBookingDto) {
    const {
      serviceType,
      bookingType,
      addressId,
      date: dateString,
      timeSlotId,
      bedrooms,
      bathrooms,
      hasPets,
      officeSize,
      floors,
      rooms,
      promoCode,
      paymentMethod,
      specialInstructions,
    } = createBookingDto;

    // Parse date
    const bookingDate = parse(dateString, 'yyyy-MM-dd', new Date());
    const today = startOfDay(new Date());

    // Validate date is not in the past
    if (isBefore(bookingDate, today)) {
      throw new BadRequestException('Cannot book for past dates');
    }

    // Validate address belongs to user
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new BadRequestException('Invalid address or address does not belong to you');
    }

    // Validate time slot exists and is active
    const timeSlot = await this.prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
    });

    if (!timeSlot || !timeSlot.isActive) {
      throw new BadRequestException('Invalid or inactive time slot');
    }

    // Check if date is a blackout date
    const blackoutDate = await this.prisma.blackoutDate.findUnique({
      where: { date: bookingDate },
    });

    if (blackoutDate) {
      throw new BadRequestException(
        `Cannot book on this date: ${blackoutDate.reason}`,
      );
    }

    // Check time slot availability
    const existingBookings = await this.prisma.booking.count({
      where: {
        date: bookingDate,
        timeSlotId,
        status: {
          in: ['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS'],
        },
      },
    });

    // Simple capacity check (default 10 slots per time)
    if (existingBookings >= 10) {
      throw new BadRequestException('This time slot is fully booked');
    }

    // Find matching pricing rule
    const pricingRule = await this.findMatchingPricingRule({
      serviceType,
      bedrooms,
      officeSize,
      floors,
      rooms,
    });

    if (!pricingRule) {
      throw new BadRequestException(
        'No pricing rule found for the provided parameters',
      );
    }

    let basePrice = Number(pricingRule.price);
    let discountAmount = 0;
    let promoCodeId = null;

    // Apply promo code if provided
    if (promoCode) {
      const promo = await this.prisma.promotionalCode.findUnique({
        where: { code: promoCode },
      });

      if (!promo || !promo.isActive) {
        throw new BadRequestException('Invalid or inactive promo code');
      }

      if (promo.startDate > new Date() || promo.endDate < new Date()) {
        throw new BadRequestException('Promo code has expired');
      }

      if (
        promo.totalUsageLimit &&
        promo.currentUsage >= promo.totalUsageLimit
      ) {
        throw new BadRequestException(
          'Promo code has reached its usage limit',
        );
      }

      if (
        promo.applicableServices.length > 0 &&
        !promo.applicableServices.includes(serviceType)
      ) {
        throw new BadRequestException(
          'Promo code is not applicable for this service type',
        );
      }

      if (promo.minPurchaseAmount && basePrice < Number(promo.minPurchaseAmount)) {
        throw new BadRequestException(
          `Minimum purchase amount of MVR ${promo.minPurchaseAmount} required`,
        );
      }

      // Calculate discount
      if (promo.discountType === 'PERCENTAGE') {
        discountAmount = basePrice * (Number(promo.discountValue) / 100);
      } else {
        discountAmount = Number(promo.discountValue);
      }

      promoCodeId = promo.id;
    }

    const finalPrice = basePrice - discountAmount;

    // Generate unique booking number
    const bookingNumber = `BK-${nanoid(10).toUpperCase()}`;

    // Create booking
    const booking = await this.prisma.booking.create({
      data: {
        bookingNumber,
        userId,
        serviceType,
        bookingType,
        status: BookingStatus.PENDING,
        addressId,
        date: bookingDate,
        timeSlotId,
        bedrooms,
        bathrooms,
        hasPets: hasPets || false,
        officeSize,
        floors,
        rooms,
        totalPrice: basePrice,
        finalPrice,
        discountAmount,
        promoCodeId,
        paymentMethod,
        specialInstructions,
      },
      include: {
        address: true,
        timeSlot: true,
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
    });

    // If promo code was used, increment usage count
    if (promoCodeId) {
      await this.prisma.promotionalCode.update({
        where: { id: promoCodeId },
        data: { currentUsage: { increment: 1 } },
      });
    }

    // Auto-assign cleaners to the booking
    try {
      await this.cleanerAssignmentService.autoAssignCleaners(booking.id);
      this.logger.log(`Auto-assignment attempted for booking ${booking.bookingNumber}`);
    } catch (error) {
      this.logger.error(`Auto-assignment failed for booking ${booking.bookingNumber}: ${error.message}`);
      // Don't fail the booking creation if auto-assignment fails
      // The booking will remain in CONFIRMED status for manual assignment
    }

    // Update availability cache based on actual assignments
    const assignedCount = await this.getAssignedCleanersCount(booking.id);
    if (assignedCount > 0) {
      await this.updateAvailabilityCache(bookingDate, timeSlotId, assignedCount);
    }

    return booking;
  }

  /**
   * Find user's bookings
   */
  async findAll(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        address: true,
        timeSlot: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get user's next upcoming booking
   */
  async getUpcoming(userId: string) {
    const today = startOfDay(new Date());

    const upcomingBooking = await this.prisma.booking.findFirst({
      where: {
        userId,
        date: { gte: today },
        status: {
          in: ['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS'],
        },
      },
      include: {
        address: true,
        timeSlot: true,
      },
      orderBy: { date: 'asc' },
    });

    return upcomingBooking;
  }

  /**
   * Find one booking by ID
   */
  async findOne(userId: string, id: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id, userId },
      include: {
        address: true,
        timeSlot: true,
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
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  /**
   * Reschedule a booking
   */
  async reschedule(
    userId: string,
    id: string,
    rescheduleDto: RescheduleBookingDto,
  ) {
    const { newDate: newDateString, newTimeSlotId } = rescheduleDto;

    // Find booking
    const booking = await this.prisma.booking.findFirst({
      where: { id, userId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check if booking can be rescheduled
    if (
      !['PENDING', 'CONFIRMED', 'ASSIGNED'].includes(booking.status)
    ) {
      throw new BadRequestException(
        'Only pending, confirmed, or assigned bookings can be rescheduled',
      );
    }

    // Check reschedule limit (max 1 time)
    if (booking.rescheduledCount >= 1) {
      throw new BadRequestException(
        'Maximum reschedule limit reached (1 time). Please contact support for further changes.',
      );
    }

    // Check minimum notice (24 hours)
    // If within 24 hours, it will be counted as a cancellation
    const hoursDiff = differenceInHours(booking.date, new Date());
    if (hoursDiff < 24) {
      throw new BadRequestException(
        'Bookings cannot be rescheduled within 24 hours of appointment time. This will be counted as a cancellation. Please cancel and create a new booking.',
      );
    }

    // Parse new date
    const newDate = parse(newDateString, 'yyyy-MM-dd', new Date());
    const today = startOfDay(new Date());

    if (isBefore(newDate, today)) {
      throw new BadRequestException('Cannot reschedule to a past date');
    }

    // Validate new time slot
    const timeSlot = await this.prisma.timeSlot.findUnique({
      where: { id: newTimeSlotId },
    });

    if (!timeSlot || !timeSlot.isActive) {
      throw new BadRequestException('Invalid or inactive time slot');
    }

    // Check if new date is a blackout date
    const blackoutDate = await this.prisma.blackoutDate.findUnique({
      where: { date: newDate },
    });

    if (blackoutDate) {
      throw new BadRequestException(
        `Cannot book on this date: ${blackoutDate.reason}`,
      );
    }

    // Count assigned cleaners BEFORE rescheduling
    const assignedCount = await this.getAssignedCleanersCount(booking.id);

    // Update booking
    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: {
        date: newDate,
        timeSlotId: newTimeSlotId,
        originalDate: booking.originalDate || booking.date,
        originalTimeSlotId:
          booking.originalTimeSlotId || booking.timeSlotId,
        rescheduledCount: { increment: 1 },
      },
      include: {
        address: true,
        timeSlot: true,
      },
    });

    // Update cache for both slots (if cleaners were assigned)
    if (assignedCount > 0) {
      // Free up old slot
      await this.updateAvailabilityCache(booking.date, booking.timeSlotId, -assignedCount);
      // Book new slot
      await this.updateAvailabilityCache(newDate, newTimeSlotId, assignedCount);
    }

    // Reassign cleaners for the new date/time
    try {
      await this.cleanerAssignmentService.reassignOnReschedule(updatedBooking.id);
      this.logger.log(`Cleaner reassignment attempted for rescheduled booking ${updatedBooking.bookingNumber}`);
    } catch (error) {
      this.logger.error(`Cleaner reassignment failed for booking ${updatedBooking.bookingNumber}: ${error.message}`);
      // Don't fail the reschedule if reassignment fails
      // Admin can manually reassign if needed
    }

    return updatedBooking;
  }

  /**
   * Cancel a booking
   */
  async cancel(userId: string, id: string, cancelDto: CancelBookingDto) {
    const { cancelReason } = cancelDto;

    // Find booking
    const booking = await this.prisma.booking.findFirst({
      where: { id, userId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check if booking can be canceled
    if (booking.status === BookingStatus.CANCELED) {
      throw new BadRequestException('Booking is already canceled');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed bookings');
    }

    // Check minimum notice (24 hours)
    const hoursDiff = differenceInHours(booking.date, new Date());
    if (hoursDiff < 24) {
      throw new BadRequestException(
        'Bookings must be canceled at least 24 hours in advance',
      );
    }

    // Count assigned cleaners BEFORE updating status
    const assignedCount = await this.getAssignedCleanersCount(booking.id);

    // Update booking
    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELED,
        canceledAt: new Date(),
        cancelReason,
      },
      include: {
        address: true,
        timeSlot: true,
      },
    });

    // Free up the slot based on actual assignments
    if (assignedCount > 0) {
      await this.updateAvailabilityCache(booking.date, booking.timeSlotId, -assignedCount);
    }

    return {
      message: 'Booking canceled successfully',
      booking: updatedBooking,
    };
  }

  /**
   * Helper: Find matching pricing rule
   */
  private async findMatchingPricingRule(params: {
    serviceType: ServiceType;
    bedrooms?: number;
    officeSize?: string;
    floors?: number;
    rooms?: number;
  }) {
    const { serviceType, bedrooms, officeSize, floors, rooms } = params;

    // Try exact match first
    const exactMatch = await this.prisma.pricingRule.findFirst({
      where: {
        serviceType,
        frequency: null, // ONE_TIME booking
        bedrooms: serviceType === ServiceType.HOME ? bedrooms : null,
        officeSize: serviceType === ServiceType.OFFICE ? officeSize : null,
        floors: serviceType === ServiceType.OFFICE ? floors : null,
        rooms: serviceType === ServiceType.OFFICE ? rooms : null,
        isActive: true,
      },
    });

    if (exactMatch) {
      return exactMatch;
    }

    // Fallback: Try minimal match
    if (serviceType === ServiceType.HOME) {
      return this.prisma.pricingRule.findFirst({
        where: {
          serviceType,
          frequency: null,
          bedrooms,
          isActive: true,
        },
      });
    } else {
      return this.prisma.pricingRule.findFirst({
        where: {
          serviceType,
          frequency: null,
          officeSize,
          isActive: true,
        },
      });
    }
  }

  /**
   * Count cleaners assigned to a booking
   */
  private async getAssignedCleanersCount(bookingId: string): Promise<number> {
    return this.prisma.cleanerAssignment.count({
      where: { bookingId },
    });
  }

  /**
   * Calculate total available cleaners for a given date
   * Available = cleaners with isAvailable:true - cleaners on vacation
   */
  private async getAvailableCleanersCount(date: Date): Promise<number> {
    return this.prisma.cleanerProfile.count({
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

  /**
   * Update or create AvailabilityCache entry for a date/slot
   * @param date - Booking date
   * @param timeSlotId - Time slot ID
   * @param cleanerCount - Number of cleaners to add/remove (+N for create, -N for cancel)
   */
  private async updateAvailabilityCache(
    date: Date,
    timeSlotId: string,
    cleanerCount: number,
  ): Promise<void> {
    const existingCache = await this.prisma.availabilityCache.findUnique({
      where: {
        date_timeSlotId: { date, timeSlotId },
      },
    });

    if (existingCache) {
      // Update existing cache
      await this.prisma.availabilityCache.update({
        where: { id: existingCache.id },
        data: {
          bookedCapacity: Math.max(0, existingCache.bookedCapacity + cleanerCount),
        },
      });
    } else {
      // Create new cache entry
      const totalCapacity = await this.getAvailableCleanersCount(date);
      await this.prisma.availabilityCache.create({
        data: {
          date,
          timeSlotId,
          totalCapacity,
          bookedCapacity: Math.max(0, cleanerCount),
        },
      });
    }
  }
}
