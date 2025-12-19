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
import { ServiceType, BookingType, BookingStatus, PaymentStatus } from '@prisma/client';
import { nanoid } from 'nanoid';
import { isBefore, differenceInHours } from 'date-fns';
import { DateUtils } from '../../common/utils/date.utils';

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
      squareFeet,
      floors,
      rooms,
      toilets,
      promoCode,
      paymentMethod,
      specialInstructions,
    } = createBookingDto;

    // Parse date as Maldives time
    const bookingDate = DateUtils.parseDateAsMaldives(dateString);
    const today = DateUtils.todayInMaldives();

    // Validate date is not in the past (in Maldives time)
    if (isBefore(DateUtils.startOfDayInMaldives(bookingDate), today)) {
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

    // Calculate pricing based on service type
    let basePrice: number;
    let discountAmount = 0;
    let promoCodeId = null;
    let estimatedPrice: number | null = null;
    let isOfficeBooking = serviceType === ServiceType.OFFICE;

    if (isOfficeBooking) {
      // Use sqft-based pricing for office bookings
      const officeQuote = await this.calculateOfficePrice({
        squareFeet: squareFeet!,
        rooms: rooms!,
        toilets: toilets!,
      });
      basePrice = officeQuote.totalPrice;
      estimatedPrice = basePrice; // Store as estimate (pending inspection)
    } else {
      // Use standard pricing rule for HOME bookings
      const pricingRule = await this.findMatchingPricingRule({
        serviceType,
        bedrooms,
        floors,
        rooms,
      });

      if (!pricingRule) {
        throw new BadRequestException(
          'No pricing rule found for the provided parameters',
        );
      }
      basePrice = Number(pricingRule.price);
    }

    // Apply promo code if provided
    if (promoCode) {
      const promo = await this.prisma.promotionalCode.findUnique({
        where: { code: promoCode.toUpperCase() },
      });

      if (!promo || !promo.isActive) {
        throw new BadRequestException('Invalid or inactive promo code');
      }

      const now = DateUtils.nowInMaldives();
      if (promo.startDate > now || promo.endDate < now) {
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

      // Check per-user usage limit
      if (promo.usageLimitPerUser) {
        const userUsageCount = await this.prisma.promoCodeUsage.count({
          where: {
            promoCodeId: promo.id,
            userId,
          },
        });

        if (userUsageCount >= promo.usageLimitPerUser) {
          throw new BadRequestException(
            'You have already used this promo code the maximum number of times',
          );
        }
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

    // Create booking with retry on booking number collision
    // Office bookings go to PENDING_INSPECTION, home bookings go to PENDING
    const bookingStatus = isOfficeBooking
      ? BookingStatus.PENDING_INSPECTION
      : BookingStatus.PENDING;

    let booking;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const bookingNumber = `BK-${nanoid(10).toUpperCase()}`;
      try {
        booking = await this.prisma.booking.create({
          data: {
            bookingNumber,
            userId,
            serviceType,
            bookingType,
            status: bookingStatus,
            addressId,
            // Address snapshot (captured at booking time for historical accuracy)
            addressLabel: address.label,
            addressAddress: address.address,
            addressStreet: address.street,
            addressLandmark: address.landmark,
            date: bookingDate,
            timeSlotId,
            bedrooms,
            bathrooms,
            hasPets: hasPets || false,
            // Office-specific fields
            squareFeet,
            floors,
            rooms,
            toilets,
            // Pricing
            totalPrice: basePrice,
            finalPrice,
            discountAmount,
            promoCodeId,
            estimatedPrice, // For office bookings, stores the initial estimate
            paymentMethod,
            paymentStatus: PaymentStatus.PAID,
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
        break; // Success - exit loop
      } catch (error: any) {
        // Check if it's a unique constraint violation on bookingNumber (Prisma error P2002)
        if (error.code === 'P2002' && error.meta?.target?.includes('bookingNumber')) {
          attempts++;
          this.logger.warn(`Booking number collision, retrying (${attempts}/${maxAttempts})`);
          continue;
        }
        throw error; // Re-throw other errors
      }
    }

    if (!booking) {
      throw new BadRequestException('Failed to generate unique booking number. Please try again.');
    }

    // If promo code was used, increment usage count and create usage record
    if (promoCodeId) {
      await this.prisma.promotionalCode.update({
        where: { id: promoCodeId },
        data: { currentUsage: { increment: 1 } },
      });

      // Create usage record for per-user tracking
      await this.prisma.promoCodeUsage.create({
        data: {
          promoCodeId,
          userId,
          bookingId: booking.id,
          discountAmount,
        },
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
    const today = DateUtils.todayInMaldives();

    const upcomingBooking = await this.prisma.booking.findFirst({
      where: {
        userId,
        date: { gte: today },
        status: {
          in: ['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS'],
        },
        // Only show paid bookings
        paymentStatus: {
          in: ['PAID', 'VERIFIED'],
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
   * Get all upcoming bookings for activity page
   * Shows only paid bookings (excludes unpaid placeholder bookings)
   */
  async getActivityBookings(userId: string) {
    const today = DateUtils.todayInMaldives();

    return this.prisma.booking.findMany({
      where: {
        userId,
        date: { gte: today },
        status: {
          in: ['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS'],
        },
        // Only show paid bookings (excludes unpaid subscription placeholders)
        paymentStatus: {
          in: ['PAID', 'VERIFIED'],
        },
      },
      include: {
        address: true,
        timeSlot: true,
      },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Get past/completed bookings for history page
   */
  async getHistoryBookings(userId: string) {
    const today = DateUtils.todayInMaldives();

    return this.prisma.booking.findMany({
      where: {
        userId,
        OR: [
          { date: { lt: today } },
          { status: { in: ['COMPLETED', 'CANCELED'] } },
        ],
      },
      include: {
        address: true,
        timeSlot: true,
      },
      orderBy: { date: 'desc' },
    });
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
    const hoursDiff = differenceInHours(booking.date, DateUtils.nowInMaldives());
    if (hoursDiff < 24) {
      throw new BadRequestException(
        'Bookings cannot be rescheduled within 24 hours of appointment time. This will be counted as a cancellation. Please cancel and create a new booking.',
      );
    }

    // Parse new date as Maldives time
    const newDate = DateUtils.parseDateAsMaldives(newDateString);
    const today = DateUtils.todayInMaldives();

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

    // Find booking with timeSlot for accurate time comparison
    const booking = await this.prisma.booking.findFirst({
      where: { id, userId },
      include: { timeSlot: true },
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
    // Combine booking date with time slot start time for accurate comparison
    // Use UTC methods to avoid timezone issues - times are in Maldives (UTC+5)
    const [hours, minutes] = booking.timeSlot.startTime.split(':').map(Number);
    const bookingDate = new Date(booking.date);
    const bookingDateTime = new Date(
      bookingDate.getUTCFullYear(),
      bookingDate.getUTCMonth(),
      bookingDate.getUTCDate(),
      hours,
      minutes,
      0,
      0
    );

    const hoursDiff = differenceInHours(bookingDateTime, DateUtils.nowInMaldives());
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
        canceledAt: DateUtils.nowInMaldives(),
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

    // Remove all cleaner assignments for this booking
    await this.prisma.cleanerAssignment.deleteMany({
      where: { bookingId: id },
    });

    return {
      message: 'Booking canceled successfully',
      booking: updatedBooking,
    };
  }

  /**
   * Helper: Find matching pricing rule (for HOME service)
   */
  private async findMatchingPricingRule(params: {
    serviceType: ServiceType;
    bedrooms?: number;
    floors?: number;
    rooms?: number;
  }) {
    const { serviceType, bedrooms } = params;

    // For HOME service, find by bedrooms
    return this.prisma.pricingRule.findFirst({
      where: {
        serviceType,
        frequency: null, // ONE_TIME booking
        bedrooms,
        isActive: true,
      },
    });
  }

  /**
   * Calculate office price based on sqft tiers and add-ons
   */
  private async calculateOfficePrice(params: {
    squareFeet: number;
    rooms: number;
    toilets: number;
  }) {
    const { squareFeet, rooms, toilets } = params;

    // 1. Find matching sqft tier
    const tier = await this.prisma.officePricingTier.findFirst({
      where: {
        sqftMin: { lte: squareFeet },
        sqftMax: { gte: squareFeet },
        frequency: null, // ONE_TIME booking
        isActive: true,
      },
    });

    if (!tier) {
      throw new BadRequestException(
        `No pricing tier found for ${squareFeet} sqft. Please contact support.`,
      );
    }

    let sqftBasePrice = Number(tier.basePrice);
    let roomAddOnTotal = 0;
    let toiletAddOnTotal = 0;

    // 2. Calculate room add-on (if rooms > 1)
    if (rooms > 1) {
      const roomAddOn = await this.prisma.officeAddOnPricing.findFirst({
        where: {
          addOnType: 'ROOM',
          isActive: true,
        },
        orderBy: { minQuantity: 'asc' },
      });

      if (roomAddOn) {
        roomAddOnTotal = Number(roomAddOn.pricePerUnit) * (rooms - 1);
      }
    }

    // 3. Calculate toilet add-on (if toilets > 1)
    if (toilets > 1) {
      const toiletAddOn = await this.prisma.officeAddOnPricing.findFirst({
        where: {
          addOnType: 'TOILET',
          isActive: true,
        },
        orderBy: { minQuantity: 'asc' },
      });

      if (toiletAddOn) {
        toiletAddOnTotal = Number(toiletAddOn.pricePerUnit) * (toilets - 1);
      }
    }

    const totalPrice = sqftBasePrice + roomAddOnTotal + toiletAddOnTotal;

    return {
      sqftTierPrice: sqftBasePrice,
      roomAddOn: roomAddOnTotal,
      toiletAddOn: toiletAddOnTotal,
      totalPrice,
    };
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
