import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SlotHoldService } from '../../common/services/slot-hold.service';
import { BookingLockService } from '../../common/services/booking-lock.service';
import { CleanerAssignmentService } from '../cleaner-assignment/cleaner-assignment.service';
import { ServicesService } from '../services/services.service';
import { CreateBookingDto } from '../bookings/dto/create-booking.dto';
import { CreateSubscriptionDto } from '../subscriptions/dto/create-subscription.dto';
import {
  ServiceType,
  BookingType,
  BookingStatus,
  PaymentStatus,
  SubscriptionFrequency,
  SubscriptionStatus,
  CheckoutType,
} from '@prisma/client';
import { nanoid } from 'nanoid';
import { v4 as uuidv4 } from 'uuid';
import { addDays, addWeeks, isBefore } from 'date-fns';
import { DateUtils } from '../../common/utils/date.utils';

const HOLD_DURATION_SECONDS = 300; // 5 minutes

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private prisma: PrismaService,
    private slotHoldService: SlotHoldService,
    private bookingLockService: BookingLockService,
    private cleanerAssignmentService: CleanerAssignmentService,
    private servicesService: ServicesService,
  ) {}

  /**
   * Create checkout session for a single booking
   */
  async createBookingCheckout(userId: string, dto: CreateBookingDto) {
    const holdGroupId = uuidv4();
    const expiresAt = new Date(Date.now() + HOLD_DURATION_SECONDS * 1000);

    // Validate and parse date
    const bookingDate = DateUtils.parseDateAsMaldives(dto.date);
    const today = DateUtils.todayInMaldives();

    if (isBefore(DateUtils.startOfDayInMaldives(bookingDate), today)) {
      throw new BadRequestException('Cannot book for past dates');
    }

    // Validate address
    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId },
    });

    if (!address) {
      throw new BadRequestException('Invalid address or address does not belong to you');
    }

    // Validate time slot
    const timeSlot = await this.prisma.timeSlot.findUnique({
      where: { id: dto.timeSlotId },
    });

    if (!timeSlot || !timeSlot.isActive) {
      throw new BadRequestException('Invalid or inactive time slot');
    }

    // Check blackout date
    const blackoutDate = await this.prisma.blackoutDate.findUnique({
      where: { date: bookingDate },
    });

    if (blackoutDate) {
      throw new BadRequestException(`Cannot book on this date: ${blackoutDate.reason}`);
    }

    // Calculate required cleaners
    const requiredCleaners = this.calculateRequiredCleaners({
      serviceType: dto.serviceType,
      bedrooms: dto.bedrooms,
      rooms: dto.rooms,
      floors: dto.floors,
    });

    // Calculate price
    const priceInfo = await this.calculateBookingPrice(dto, userId);

    // Create slot hold
    try {
      await this.slotHoldService.createHold({
        userId,
        holdGroupId,
        date: bookingDate,
        timeSlotId: dto.timeSlotId,
        capacity: requiredCleaners,
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new BadRequestException('This time slot is no longer available');
      }
      throw error;
    }

    // Create checkout session
    const session = await this.prisma.checkoutSession.create({
      data: {
        userId,
        type: CheckoutType.BOOKING,
        details: dto as any,
        holdGroupId,
        expiresAt,
        status: 'PENDING',
      },
    });

    return {
      checkoutSessionId: session.id,
      expiresAt: session.expiresAt,
      holdDurationSeconds: HOLD_DURATION_SECONDS,
      price: priceInfo,
    };
  }

  /**
   * Create checkout session for a subscription
   */
  async createSubscriptionCheckout(userId: string, dto: CreateSubscriptionDto) {
    const holdGroupId = uuidv4();
    const expiresAt = new Date(Date.now() + HOLD_DURATION_SECONDS * 1000);

    // Validate address
    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found or does not belong to user');
    }

    // Verify all time slots exist and are active
    const timeSlotIds = dto.daySlots.map((ds) => ds.timeSlotId);
    const uniqueTimeSlotIds = [...new Set(timeSlotIds)];
    const timeSlots = await this.prisma.timeSlot.findMany({
      where: { id: { in: uniqueTimeSlotIds } },
    });

    if (timeSlots.length !== uniqueTimeSlotIds.length) {
      throw new NotFoundException('One or more time slots not found');
    }

    const inactiveSlot = timeSlots.find((ts) => !ts.isActive);
    if (inactiveSlot) {
      throw new BadRequestException('One or more time slots are inactive');
    }

    // Calculate required cleaners
    const requiredCleaners = this.calculateRequiredCleaners({
      serviceType: dto.serviceType,
      bedrooms: dto.bedrooms,
      rooms: dto.rooms,
      floors: dto.floors,
    });

    // Generate all booking slots for 12 weeks
    const slots = this.generateSubscriptionSlots(dto, requiredCleaners);

    // Create all slot holds atomically
    try {
      await this.slotHoldService.createMultipleHolds({
        userId,
        holdGroupId,
        slots,
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    // Calculate subscription price
    const priceInfo = await this.calculateSubscriptionPrice(dto);

    // Create checkout session
    const session = await this.prisma.checkoutSession.create({
      data: {
        userId,
        type: CheckoutType.SUBSCRIPTION,
        details: dto as any,
        holdGroupId,
        expiresAt,
        status: 'PENDING',
      },
    });

    return {
      checkoutSessionId: session.id,
      expiresAt: session.expiresAt,
      holdDurationSeconds: HOLD_DURATION_SECONDS,
      price: priceInfo,
      slotsReserved: slots.length,
    };
  }

  /**
   * Get checkout session with remaining time
   */
  async getCheckoutSession(sessionId: string, userId: string) {
    const session = await this.prisma.checkoutSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Checkout session not found');
    }

    const remainingSeconds = await this.slotHoldService.getHoldTimeRemaining(
      session.holdGroupId,
    );

    return {
      id: session.id,
      type: session.type,
      status: session.status,
      expiresAt: session.expiresAt,
      remainingSeconds: remainingSeconds ?? 0,
      isExpired: remainingSeconds === null || remainingSeconds === 0,
      createdAt: session.createdAt,
    };
  }

  /**
   * Cancel checkout session and release holds
   */
  async cancelCheckout(sessionId: string, userId: string) {
    const session = await this.prisma.checkoutSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Checkout session not found');
    }

    if (session.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel a completed checkout');
    }

    // Release holds
    await this.slotHoldService.releaseHolds(session.holdGroupId);

    // Update session status
    await this.prisma.checkoutSession.update({
      where: { id: sessionId },
      data: { status: 'EXPIRED' },
    });

    return { message: 'Checkout cancelled successfully' };
  }

  /**
   * Complete checkout and create booking/subscription
   * Called after payment is confirmed
   */
  async completeCheckout(sessionId: string) {
    const session = await this.prisma.checkoutSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Checkout session not found');
    }

    if (session.status === 'COMPLETED') {
      throw new BadRequestException('Checkout already completed');
    }

    // Check if hold is still valid
    const isValid = await this.slotHoldService.isHoldValid(session.holdGroupId);
    if (!isValid) {
      await this.prisma.checkoutSession.update({
        where: { id: sessionId },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Checkout session expired. Please try again.');
    }

    let result: any;

    if (session.type === CheckoutType.BOOKING) {
      result = await this.createBookingFromSession(session);
    } else {
      result = await this.createSubscriptionFromSession(session);
    }

    // Release holds (slots are now booked in AvailabilityCache)
    await this.slotHoldService.releaseHolds(session.holdGroupId);

    // Mark session complete
    await this.prisma.checkoutSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED' },
    });

    return result;
  }

  /**
   * Create actual booking from checkout session
   */
  private async createBookingFromSession(session: any) {
    const dto = session.details as CreateBookingDto;
    const userId = session.userId;

    const bookingDate = DateUtils.parseDateAsMaldives(dto.date);

    // Get address for snapshot
    const address = await this.prisma.address.findUnique({
      where: { id: dto.addressId },
    });

    if (!address) {
      throw new BadRequestException('Address not found');
    }

    // Calculate required cleaners
    const requiredCleaners = this.calculateRequiredCleaners({
      serviceType: dto.serviceType,
      bedrooms: dto.bedrooms,
      rooms: dto.rooms,
      floors: dto.floors,
    });

    // Reserve slot in AvailabilityCache
    // Exclude own hold group so the user's hold doesn't block their own checkout
    await this.bookingLockService.reserveSlot({
      date: bookingDate,
      timeSlotId: dto.timeSlotId,
      requiredCapacity: requiredCleaners,
      excludeHoldGroupId: session.holdGroupId,
    });

    // Calculate price
    const priceInfo = await this.calculateBookingPrice(dto, userId);
    const isOfficeBooking = dto.serviceType === ServiceType.OFFICE;

    // Create booking
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
            serviceType: dto.serviceType,
            bookingType: dto.bookingType,
            status: isOfficeBooking ? BookingStatus.PENDING_INSPECTION : BookingStatus.PENDING,
            addressId: dto.addressId,
            addressLabel: address.label,
            addressAddress: address.address,
            addressStreet: address.street,
            addressLandmark: address.landmark,
            date: bookingDate,
            timeSlotId: dto.timeSlotId,
            bedrooms: dto.bedrooms,
            bathrooms: dto.bathrooms,
            hasPets: dto.hasPets || false,
            squareFeet: dto.squareFeet,
            floors: dto.floors,
            rooms: dto.rooms,
            toilets: dto.toilets,
            totalPrice: priceInfo.basePrice,
            finalPrice: priceInfo.finalPrice,
            discountAmount: priceInfo.discountAmount,
            promoCodeId: priceInfo.promoCodeId,
            estimatedPrice: isOfficeBooking ? priceInfo.basePrice : null,
            paymentMethod: dto.paymentMethod,
            paymentStatus: isOfficeBooking ? PaymentStatus.PENDING : PaymentStatus.PAID,
            specialInstructions: dto.specialInstructions,
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
        break;
      } catch (error: any) {
        if (error.code === 'P2002' && error.meta?.target?.includes('bookingNumber')) {
          attempts++;
          continue;
        }
        throw error;
      }
    }

    if (!booking) {
      throw new BadRequestException('Failed to generate unique booking number');
    }

    // Record promo code usage
    if (priceInfo.promoCodeId) {
      await this.prisma.promotionalCode.update({
        where: { id: priceInfo.promoCodeId },
        data: { currentUsage: { increment: 1 } },
      });

      await this.prisma.promoCodeUsage.create({
        data: {
          promoCodeId: priceInfo.promoCodeId,
          userId,
          bookingId: booking.id,
          discountAmount: priceInfo.discountAmount,
        },
      });
    }

    // Auto-assign cleaners
    try {
      await this.cleanerAssignmentService.autoAssignCleaners(booking.id);
    } catch (error) {
      this.logger.error(`Auto-assignment failed: ${error.message}`);
    }

    return booking;
  }

  /**
   * Create actual subscription from checkout session
   */
  private async createSubscriptionFromSession(session: any) {
    const dto = session.details as CreateSubscriptionDto;
    const userId = session.userId;

    // Get address for snapshot
    const address = await this.prisma.address.findUnique({
      where: { id: dto.addressId },
    });

    if (!address) {
      throw new BadRequestException('Address not found');
    }

    const selectedDays = dto.daySlots.map((ds) => ds.day);
    const today = DateUtils.todayInMaldives();
    let startDate = dto.startDate
      ? DateUtils.parseDateAsMaldives(dto.startDate)
      : addDays(today, 1);

    // Calculate monthly price
    const priceInfo = await this.calculateSubscriptionPrice(dto);

    // Create subscription
    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        frequency: dto.frequency,
        selectedDays,
        addressId: dto.addressId,
        addressLabel: address.label,
        addressAddress: address.address,
        addressStreet: address.street,
        addressLandmark: address.landmark,
        serviceType: dto.serviceType,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        hasPets: dto.hasPets || false,
        officeSize: dto.officeSize,
        floors: dto.floors,
        rooms: dto.rooms,
        squareFeet: dto.squareFeet,
        toilets: dto.toilets,
        monthlyPrice: priceInfo.finalPrice,
        nextBillingDate: startDate,
        startDate,
        status: SubscriptionStatus.ACTIVE,
        autoRenew: true,
        daySlots: {
          create: dto.daySlots.map((ds) => ({
            dayOfWeek: ds.day,
            timeSlotId: ds.timeSlotId,
          })),
        },
      },
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
        address: true,
        daySlots: {
          include: { timeSlot: true },
        },
      },
    });

    // Generate bookings for 12 weeks
    await this.generateBookingsForSubscription(subscription, 12, session.holdGroupId);

    // Update next billing date
    const lastPaidBooking = await this.prisma.booking.findFirst({
      where: {
        subscriptionId: subscription.id,
        paymentStatus: PaymentStatus.PAID,
      },
      orderBy: { date: 'desc' },
    });

    if (lastPaidBooking) {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { nextBillingDate: lastPaidBooking.date },
      });
    }

    return subscription;
  }

  /**
   * Generate bookings for subscription (adapted from subscriptions.service)
   */
  private async generateBookingsForSubscription(subscription: any, weeksToGenerate: number, holdGroupId?: string) {
    const bookings = [];
    const reservations = [];

    // Build a map of dayOfWeek to timeSlotId
    const dayTimeMap = new Map<number, string>();
    for (const ds of subscription.daySlots) {
      dayTimeMap.set(ds.dayOfWeek, ds.timeSlotId);
    }

    const isOfficeBooking = subscription.serviceType === ServiceType.OFFICE;
    const requiredCleaners = this.calculateRequiredCleaners({
      serviceType: subscription.serviceType,
      bedrooms: subscription.bedrooms,
      rooms: subscription.rooms,
      floors: subscription.floors,
    });

    let paidBookingsCreated = 0;
    // Calculate paid sessions based on frequency (4 weeks × sessions per week)
    // ONCE_A_WEEK = 4, TWICE_A_WEEK = 8, THRICE_A_WEEK = 12
    const sessionsPerWeek = subscription.frequency === 'ONCE_A_WEEK' ? 1
      : subscription.frequency === 'TWICE_A_WEEK' ? 2
      : subscription.frequency === 'THRICE_A_WEEK' ? 3
      : 1;
    const paidSessionsTarget = 4 * sessionsPerWeek;

    for (let week = 0; week < weeksToGenerate; week++) {
      const weekStart = addWeeks(subscription.startDate, week);

      for (const day of subscription.selectedDays.sort((a: number, b: number) => a - b)) {
        // Use Maldives timezone for day-of-week calculation to avoid server timezone issues
        const weekStartDayOfWeek = DateUtils.getDayOfWeekInMaldives(weekStart);
        let bookingDate = addDays(weekStart, (day - weekStartDayOfWeek + 7) % 7);

        if (week === 0 && bookingDate < subscription.startDate) {
          bookingDate = addDays(bookingDate, 7);
        }

        if (bookingDate < subscription.startDate) continue;

        const timeSlotId = dayTimeMap.get(day);
        if (!timeSlotId) continue;

        const isBlackout = await this.prisma.blackoutDate.findUnique({
          where: { date: bookingDate },
        });
        if (isBlackout) continue;

        const isPaid = paidBookingsCreated < paidSessionsTarget;
        if (isPaid) paidBookingsCreated++;

        reservations.push({
          date: bookingDate,
          timeSlotId,
          requiredCapacity: requiredCleaners,
          excludeHoldGroupId: holdGroupId, // Exclude own hold so checkout doesn't block itself
        });

        bookings.push({
          bookingNumber: `BK-${nanoid(10).toUpperCase()}`,
          userId: subscription.userId,
          serviceType: subscription.serviceType,
          bookingType: BookingType.SUBSCRIPTION,
          status: isOfficeBooking ? BookingStatus.PENDING_INSPECTION : BookingStatus.CONFIRMED,
          addressId: subscription.addressId,
          addressLabel: subscription.addressLabel,
          addressAddress: subscription.addressAddress,
          addressStreet: subscription.addressStreet,
          addressLandmark: subscription.addressLandmark,
          date: bookingDate,
          timeSlotId,
          bedrooms: subscription.bedrooms,
          bathrooms: subscription.bathrooms,
          hasPets: subscription.hasPets,
          officeSize: subscription.officeSize,
          squareFeet: subscription.squareFeet,
          floors: subscription.floors,
          rooms: subscription.rooms,
          toilets: subscription.toilets,
          totalPrice: subscription.monthlyPrice / 4,
          finalPrice: subscription.monthlyPrice / 4,
          subscriptionId: subscription.id,
          paymentStatus: isPaid ? PaymentStatus.PAID : PaymentStatus.PENDING,
        });
      }
    }

    // Reserve all slots
    if (reservations.length > 0) {
      await this.bookingLockService.reserveMultipleSlots(reservations);
    }

    // Create all bookings
    this.logger.log(
      `Creating ${bookings.length} bookings for subscription (frequency=${subscription.frequency}, paidSessionsTarget=${paidSessionsTarget})`,
    );

    let assignedCount = 0;
    for (const bookingData of bookings) {
      const created = await this.prisma.booking.create({ data: bookingData });

      // Auto-assign cleaners for paid bookings
      if (bookingData.paymentStatus === PaymentStatus.PAID) {
        try {
          await this.cleanerAssignmentService.autoAssignCleaners(created.id);
          assignedCount++;
        } catch (error) {
          this.logger.error(`Auto-assignment failed for booking ${created.id}: ${error.message}`);
        }
      }
    }

    this.logger.log(
      `Subscription booking creation complete: ${bookings.length} total, ${assignedCount} auto-assigned`,
    );

    return bookings.length;
  }

  /**
   * Generate slot data for subscription holds
   */
  private generateSubscriptionSlots(dto: CreateSubscriptionDto, requiredCleaners: number) {
    const slots: Array<{ date: Date; timeSlotId: string; capacity: number }> = [];

    const today = DateUtils.todayInMaldives();
    const startDate = dto.startDate
      ? DateUtils.parseDateAsMaldives(dto.startDate)
      : addDays(today, 1);

    const dayTimeMap = new Map<number, string>();
    for (const ds of dto.daySlots) {
      dayTimeMap.set(ds.day, ds.timeSlotId);
    }

    const selectedDays = dto.daySlots.map((ds) => ds.day);

    for (let week = 0; week < 12; week++) {
      const weekStart = addWeeks(startDate, week);

      for (const day of selectedDays.sort((a, b) => a - b)) {
        // Use Maldives timezone for day-of-week calculation to avoid server timezone issues
        const weekStartDayOfWeek = DateUtils.getDayOfWeekInMaldives(weekStart);
        let bookingDate = addDays(weekStart, (day - weekStartDayOfWeek + 7) % 7);

        if (week === 0 && bookingDate < startDate) {
          bookingDate = addDays(bookingDate, 7);
        }

        if (bookingDate < startDate) continue;

        const timeSlotId = dayTimeMap.get(day);
        if (!timeSlotId) continue;

        slots.push({
          date: bookingDate,
          timeSlotId,
          capacity: requiredCleaners,
        });
      }
    }

    return slots;
  }

  /**
   * Calculate price for a booking using ServicesService
   */
  private async calculateBookingPrice(dto: CreateBookingDto, userId: string) {
    let discountAmount = 0;
    let promoCodeId: string | null = null;

    // Use ServicesService for price calculation
    const quote = await this.servicesService.calculateQuote({
      serviceType: dto.serviceType,
      frequency: undefined, // One-time booking
      bedrooms: dto.bedrooms,
      squareFeet: dto.squareFeet,
      floors: dto.floors,
      rooms: dto.rooms,
      toilets: dto.toilets,
      promoCode: dto.promoCode,
    });

    const basePrice = quote.pricing.basePrice;
    discountAmount = quote.pricing.discount;

    // Get promo code ID if applied
    if (dto.promoCode && quote.promoCode) {
      const promo = await this.prisma.promotionalCode.findUnique({
        where: { code: dto.promoCode.toUpperCase() },
      });
      promoCodeId = promo?.id ?? null;
    }

    return {
      basePrice,
      discountAmount,
      finalPrice: quote.pricing.finalPrice,
      promoCodeId,
    };
  }

  /**
   * Calculate price for a subscription using ServicesService
   */
  private async calculateSubscriptionPrice(dto: CreateSubscriptionDto) {
    // Use ServicesService for price calculation
    const quote = await this.servicesService.calculateQuote({
      serviceType: dto.serviceType,
      frequency: dto.frequency,
      bedrooms: dto.bedrooms,
      squareFeet: dto.squareFeet,
      floors: dto.floors,
      rooms: dto.rooms,
      toilets: dto.toilets,
    });

    return {
      basePrice: quote.pricing.basePrice,
      discountAmount: quote.pricing.discount,
      finalPrice: quote.pricing.finalPrice,
    };
  }

  /**
   * Calculate required cleaners based on service parameters
   */
  private calculateRequiredCleaners(params: {
    serviceType: ServiceType;
    bedrooms?: number;
    rooms?: number;
    floors?: number;
  }): number {
    const { serviceType, bedrooms, rooms, floors } = params;

    if (serviceType === ServiceType.HOME) {
      if (!bedrooms || bedrooms <= 2) return 1;
      if (bedrooms === 3) return 2;
      if (bedrooms === 4) return 2;
      return 3;
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
