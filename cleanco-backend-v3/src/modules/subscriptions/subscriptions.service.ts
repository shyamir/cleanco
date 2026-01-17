import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CleanerAssignmentService } from '../cleaner-assignment/cleaner-assignment.service';
import { BookingLockService, SlotReservation } from '../../common/services/booking-lock.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { ServiceType, SubscriptionFrequency, SubscriptionStatus, BookingType, BookingStatus, PaymentStatus } from '@prisma/client';
import { addMonths, addDays, addWeeks, differenceInWeeks } from 'date-fns';
import { DateUtils } from '../../common/utils/date.utils';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cleanerAssignmentService: CleanerAssignmentService,
    private readonly bookingLockService: BookingLockService,
  ) {}

  /**
   * Create a new subscription for a customer
   */
  async create(userId: string, createSubscriptionDto: CreateSubscriptionDto) {
    const {
      serviceType,
      frequency,
      addressId,
      daySlots,
      startDate: startDateStr,
      bedrooms,
      bathrooms,
      hasPets,
      officeSize,
      floors,
      rooms,
      squareFeet,
      toilets,
    } = createSubscriptionDto;

    // Verify address belongs to user
    const address = await this.prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      throw new NotFoundException('Address not found or does not belong to user');
    }

    // Verify all time slots exist and are active
    const timeSlotIds = daySlots.map((ds) => ds.timeSlotId);
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

    // Extract selected days from daySlots
    const selectedDays = daySlots.map((ds) => ds.day);

    // Validate selected days match frequency
    this.validateSelectedDays(frequency, selectedDays);

    // Calculate monthly price based on frequency and service details
    const monthlyPrice = await this.calculateMonthlyPrice(
      serviceType,
      frequency,
      bedrooms,
      officeSize,
      floors,
      rooms,
    );

    // Determine start date: use provided date or default to tomorrow
    let startDate: Date;
    const today = DateUtils.todayInMaldives();

    if (startDateStr) {
      // Parse the provided start date as a Maldives date
      startDate = DateUtils.parseDateAsMaldives(startDateStr);

      // Validate the start date is not in the past
      if (startDate < today) {
        throw new BadRequestException('Start date cannot be in the past');
      }
    } else {
      // Default to tomorrow for backward compatibility
      startDate = addDays(today, 1);
    }

    // Create subscription with daySlots relation
    // Subscription is ACTIVE for all types, but office bookings will be PENDING_INSPECTION
    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        frequency,
        selectedDays,
        addressId,
        // Address snapshot (captured at subscription time for historical accuracy)
        addressLabel: address.label,
        addressAddress: address.address,
        addressStreet: address.street,
        addressLandmark: address.landmark,
        serviceType,
        bedrooms,
        bathrooms,
        hasPets: hasPets || false,
        officeSize,
        floors,
        rooms,
        squareFeet,
        toilets,
        monthlyPrice,
        nextBillingDate: startDate, // Temporary, will be updated
        startDate,
        status: SubscriptionStatus.ACTIVE,
        autoRenew: true,
        daySlots: {
          create: daySlots.map((ds) => ({
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
        daySlots: {
          include: {
            timeSlot: true,
          },
        },
      },
    });

    this.logger.log(`Created subscription ${subscription.id} for user ${userId}`);

    // Generate 12 weeks of bookings
    await this.generateBookingsForSubscription(subscription, 12);

    // Set nextBillingDate to the date of the last paid booking
    const lastPaidBooking = await this.prisma.booking.findFirst({
      where: {
        subscriptionId: subscription.id,
        paymentStatus: 'PAID',
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
   * Get all subscriptions for a user
   */
  async findUserSubscriptions(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
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
        address: {
          select: {
            id: true,
            label: true,
            address: true,
            street: true,
            landmark: true,
          },
        },
        timeSlot: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
          },
        },
        daySlots: {
          include: {
            timeSlot: {
              select: {
                id: true,
                startTime: true,
                endTime: true,
                displayStartTime: true,
              },
            },
          },
          orderBy: { dayOfWeek: 'asc' },
        },
        bookings: {
          select: { date: true },
          orderBy: { date: 'asc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single subscription by ID
   */
  async findOne(id: string, userId?: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
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
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // If userId provided, verify ownership
    if (userId && subscription.userId !== userId) {
      throw new ForbiddenException('Access denied to this subscription');
    }

    return subscription;
  }

  /**
   * Update subscription details (time slot, selected days)
   */
  async update(id: string, userId: string, updateSubscriptionDto: UpdateSubscriptionDto) {
    const subscription = await this.findOne(id, userId);

    // Only allow updates for active subscriptions
    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Only active subscriptions can be updated');
    }

    const { timeSlotId, selectedDays } = updateSubscriptionDto;

    // Verify time slot if provided
    if (timeSlotId) {
      const timeSlot = await this.prisma.timeSlot.findUnique({
        where: { id: timeSlotId },
      });

      if (!timeSlot || !timeSlot.isActive) {
        throw new NotFoundException('Time slot not found or inactive');
      }
    }

    // Validate selected days if provided
    if (selectedDays) {
      this.validateSelectedDays(subscription.frequency, selectedDays);
    }

    const updatedSubscription = await this.prisma.subscription.update({
      where: { id },
      data: {
        ...(timeSlotId && { timeSlotId }),
        ...(selectedDays && { selectedDays }),
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
      },
    });

    this.logger.log(`Updated subscription ${id}`);

    return updatedSubscription;
  }

  /**
   * Pause a subscription
   */
  async pause(id: string, userId: string) {
    const subscription = await this.findOne(id, userId);

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Only active subscriptions can be paused');
    }

    const updated = await this.prisma.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.PAUSED },
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
    });

    this.logger.log(`Paused subscription ${id}`);

    return updated;
  }

  /**
   * Resume a paused subscription
   */
  async resume(id: string, userId: string) {
    const subscription = await this.findOne(id, userId);

    if (subscription.status !== SubscriptionStatus.PAUSED) {
      throw new BadRequestException('Only paused subscriptions can be resumed');
    }

    const updated = await this.prisma.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.ACTIVE },
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
    });

    this.logger.log(`Resumed subscription ${id}`);

    return updated;
  }

  /**
   * Cancel a subscription and all related future bookings
   */
  async cancel(id: string, userId: string) {
    const subscription = await this.findOne(id, userId);

    if (subscription.status === SubscriptionStatus.CANCELED) {
      throw new BadRequestException('Subscription is already canceled');
    }

    const today = DateUtils.todayInMaldives();

    // Calculate required cleaners for this subscription
    const requiredCleaners = this.calculateRequiredCleaners(subscription);

    // Get UNPAID future bookings that will be deleted
    // (Paid bookings remain as-is so customer still gets the cleanings they paid for)
    const unpaidFutureBookings = await this.prisma.booking.findMany({
      where: {
        subscriptionId: id,
        date: { gte: today },
        paymentStatus: PaymentStatus.PENDING,
        status: { not: BookingStatus.CANCELED },
      },
    });

    // Release reserved slots only for unpaid bookings being deleted
    for (const booking of unpaidFutureBookings) {
      await this.bookingLockService.releaseSlot({
        date: booking.date,
        timeSlotId: booking.timeSlotId,
        requiredCapacity: requiredCleaners,
      });
    }

    // Delete unpaid future bookings (placeholders that shouldn't show in history)
    const deletedBookings = await this.prisma.booking.deleteMany({
      where: {
        subscriptionId: id,
        date: { gte: today },
        paymentStatus: PaymentStatus.PENDING,
        status: { not: BookingStatus.CANCELED },
      },
    });

    // Find the last paid booking to determine the subscription end date
    const lastPaidBooking = await this.prisma.booking.findFirst({
      where: {
        subscriptionId: id,
        paymentStatus: { in: [PaymentStatus.PAID, PaymentStatus.VERIFIED] },
        status: { not: BookingStatus.CANCELED },
      },
      orderBy: { date: 'desc' },
    });

    // Count paid future bookings that will remain (for logging)
    const paidBookingsCount = await this.prisma.booking.count({
      where: {
        subscriptionId: id,
        date: { gte: today },
        paymentStatus: { in: [PaymentStatus.PAID, PaymentStatus.VERIFIED] },
        status: { not: BookingStatus.CANCELED },
      },
    });

    // End date is the last paid booking date, or today if no paid bookings
    const subscriptionEndDate = lastPaidBooking?.date ?? DateUtils.nowInMaldives();

    // Update subscription status
    const updated = await this.prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.CANCELED,
        endDate: subscriptionEndDate,
        autoRenew: false,
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
      },
    });

    const endDateStr = subscriptionEndDate instanceof Date
      ? subscriptionEndDate.toISOString().split('T')[0]
      : new Date(subscriptionEndDate).toISOString().split('T')[0];
    this.logger.log(`Canceled subscription ${id}, end date set to ${endDateStr}, deleted ${deletedBookings.count} unpaid bookings, ${paidBookingsCount} paid bookings remain active`);

    return updated;
  }

  /**
   * Admin: Get all subscriptions with filters
   */
  async findAll(status?: SubscriptionStatus, userId?: string) {
    return this.prisma.subscription.findMany({
      where: {
        ...(status && { status }),
        ...(userId && { userId }),
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Validate selected days match the subscription frequency
   */
  private validateSelectedDays(frequency: SubscriptionFrequency, selectedDays: number[]) {
    const requiredDays = {
      [SubscriptionFrequency.ONCE_A_WEEK]: 1,
      [SubscriptionFrequency.TWICE_A_WEEK]: 2,
      [SubscriptionFrequency.THRICE_A_WEEK]: 3,
    };

    if (selectedDays.length !== requiredDays[frequency]) {
      throw new BadRequestException(
        `${frequency} requires exactly ${requiredDays[frequency]} day(s) to be selected`,
      );
    }

    // Check for duplicate days
    const uniqueDays = new Set(selectedDays);
    if (uniqueDays.size !== selectedDays.length) {
      throw new BadRequestException('Selected days cannot contain duplicates');
    }
  }

  /**
   * Calculate monthly price for a subscription
   * Uses HomePricingRule for HOME service, OfficePricingTier for OFFICE
   */
  private async calculateMonthlyPrice(
    serviceType: ServiceType,
    frequency: SubscriptionFrequency,
    bedrooms?: number,
    officeSize?: string,
    floors?: number,
    rooms?: number,
  ): Promise<number> {
    if (serviceType === ServiceType.HOME) {
      // Use HomePricingRule for HOME service
      const rule = await this.prisma.homePricingRule.findFirst({
        where: {
          frequency,
          bedrooms,
          isActive: true,
        },
      });

      if (!rule) {
        throw new NotFoundException('No pricing rule found for the provided parameters');
      }

      return Number(rule.price);
    }

    // OFFICE service uses OfficePricingTier (legacy PricingRule not used)
    throw new NotFoundException('Office subscription pricing not supported via this method');
  }

  /**
   * Generate bookings for a subscription
   * Creates bookings for the specified number of weeks based on daySlots
   */
  private async generateBookingsForSubscription(
    subscription: any,
    weeksToGenerate: number,
  ) {
    const bookings = [];
    const reservations: SlotReservation[] = [];
    // Get today's date string in Maldives timezone for date-only comparison
    const todayStr = DateUtils.formatInMaldives(new Date(), 'yyyy-MM-dd');

    // Fetch address for snapshot
    const address = await this.prisma.address.findUnique({
      where: { id: subscription.addressId },
    });

    // Fetch daySlots if not included in subscription object
    let daySlots = subscription.daySlots;
    if (!daySlots || daySlots.length === 0) {
      daySlots = await this.prisma.subscriptionDaySlot.findMany({
        where: { subscriptionId: subscription.id },
      });
    }

    // Build a map of day -> timeSlotId for quick lookup
    const dayToTimeSlot: Record<number, string> = {};
    for (const slot of daySlots) {
      dayToTimeSlot[slot.dayOfWeek] = slot.timeSlotId;
    }

    // Fallback to old single timeSlotId for backward compatibility
    const fallbackTimeSlotId = subscription.timeSlotId;

    // Get sessions count for determining which bookings are paid
    const sessionsPerMonth: Record<SubscriptionFrequency, number> = {
      [SubscriptionFrequency.ONCE_A_WEEK]: 4,
      [SubscriptionFrequency.TWICE_A_WEEK]: 8,
      [SubscriptionFrequency.THRICE_A_WEEK]: 12,
    };
    const paidSessionsCount = sessionsPerMonth[subscription.frequency as SubscriptionFrequency];
    // Use full subscription monthly price for all bookings
    const subscriptionPrice = Number(subscription.monthlyPrice);

    // Calculate required cleaners for this subscription
    const requiredCleaners = this.calculateRequiredCleaners(subscription);

    // Get next booking number and track paid sessions
    let bookingCounter = 0;
    let paidBookingsCreated = 0;

    // Helper function to find first occurrence of a day of week on or after startDate
    // This avoids timezone issues with setDay by using Maldives timezone
    const findFirstOccurrence = (startDate: Date, targetDayOfWeek: number): Date => {
      const startDayInMaldives = DateUtils.getDayOfWeekInMaldives(startDate);
      let daysToAdd = targetDayOfWeek - startDayInMaldives;
      if (daysToAdd < 0) {
        daysToAdd += 7; // Move to next week if the day has passed this week
      }
      return addDays(startDate, daysToAdd);
    };

    // Generate bookings and reservations for each week
    for (let week = 0; week < weeksToGenerate; week++) {
      // Create booking for each selected day in this week
      for (const dayOfWeek of subscription.selectedDays) {
        // Find the first occurrence of this day, then add weeks
        const firstOccurrence = findFirstOccurrence(subscription.startDate, dayOfWeek);
        const bookingDate = addWeeks(firstOccurrence, week);

        // Get the time slot for this day (from daySlots or fallback)
        const timeSlotId = dayToTimeSlot[dayOfWeek] || fallbackTimeSlotId;

        // Compare dates as strings in Maldives timezone to avoid time component issues
        const bookingDateStr = DateUtils.formatInMaldives(bookingDate, 'yyyy-MM-dd');

        // Only create bookings for today or future dates
        if (bookingDateStr >= todayStr && timeSlotId) {
          const bookingNumber = `BK${Date.now()}${bookingCounter++}`;
          const bookingDateNormalized = DateUtils.startOfDayInMaldives(bookingDate);

          // Add to reservations list
          reservations.push({
            date: bookingDateNormalized,
            timeSlotId,
            requiredCapacity: requiredCleaners,
          });

          // First month's worth of bookings are PAID, rest are PENDING (placeholders)
          const isPaidBooking = paidBookingsCreated < paidSessionsCount;
          if (isPaidBooking) {
            paidBookingsCreated++;
          }

          // Office subscriptions go to PENDING_INSPECTION, home subscriptions go to PENDING
          const isOfficeBooking = subscription.serviceType === ServiceType.OFFICE;
          const bookingStatus = isOfficeBooking
            ? BookingStatus.PENDING_INSPECTION
            : BookingStatus.PENDING;

          bookings.push({
            bookingNumber,
            userId: subscription.userId,
            addressId: subscription.addressId,
            // Address snapshot (captured at booking time for historical accuracy)
            addressLabel: address?.label,
            addressAddress: address?.address,
            addressStreet: address?.street,
            addressLandmark: address?.landmark,
            serviceType: subscription.serviceType,
            bookingType: BookingType.SUBSCRIPTION,
            timeSlotId,
            date: bookingDateNormalized,
            totalPrice: subscriptionPrice,
            finalPrice: subscriptionPrice,
            bedrooms: subscription.bedrooms,
            bathrooms: subscription.bathrooms,
            hasPets: subscription.hasPets,
            officeSize: subscription.officeSize,
            floors: subscription.floors,
            rooms: subscription.rooms,
            squareFeet: subscription.squareFeet,
            toilets: subscription.toilets,
            subscriptionId: subscription.id,
            status: bookingStatus,
            paymentStatus: isPaidBooking ? PaymentStatus.PAID : PaymentStatus.PENDING,
            adminApproved: false,
            // Store estimated price for office bookings
            estimatedPrice: isOfficeBooking ? subscriptionPrice : undefined,
          });
        }
      }
    }

    if (bookings.length === 0) {
      return 0;
    }

    // STEP 1: Reserve all slots atomically FIRST
    try {
      await this.bookingLockService.reserveMultipleSlots(reservations);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new BadRequestException(
          `Unable to create subscription: some time slots are no longer available. ${error.message}`,
        );
      }
      throw error;
    }

    // STEP 2: Create all bookings
    try {
      await this.prisma.booking.createMany({
        data: bookings,
      });

      this.logger.log(`Generated ${bookings.length} bookings for subscription ${subscription.id}`);

      // Auto-assign cleaners to the newly created bookings
      // Include both PENDING (home) and PENDING_INSPECTION (office) statuses
      const createdBookings = await this.prisma.booking.findMany({
        where: {
          subscriptionId: subscription.id,
          date: { gte: DateUtils.todayInMaldives() },
          status: { in: [BookingStatus.PENDING, BookingStatus.PENDING_INSPECTION] },
        },
        orderBy: { date: 'asc' },
      });

      this.logger.log(`Found ${createdBookings.length} bookings to auto-assign for subscription ${subscription.id}`);

      // Log all booking dates/times for debugging
      const bookingSummary = createdBookings.map((b) => ({
        id: b.id,
        date: b.date.toISOString().split('T')[0],
        timeSlotId: b.timeSlotId,
        status: b.status,
      }));
      this.logger.log(`Bookings to assign: ${JSON.stringify(bookingSummary, null, 2)}`);

      let assignedCount = 0;
      let failedCount = 0;

      for (const booking of createdBookings) {
        try {
          await this.cleanerAssignmentService.autoAssignCleaners(booking.id);
          assignedCount++;
          this.logger.log(`Auto-assigned cleaners to booking ${booking.id} (${assignedCount}/${createdBookings.length})`);
        } catch (error) {
          failedCount++;
          this.logger.error(`Auto-assignment failed for subscription booking ${booking.id}: ${error.message}`);
          // Don't fail the subscription creation if auto-assignment fails
        }
      }

      this.logger.log(`Auto-assignment complete: ${assignedCount} succeeded, ${failedCount} failed out of ${createdBookings.length} bookings`);
    } catch (error) {
      // Rollback: release all reserved slots
      for (const reservation of reservations) {
        await this.bookingLockService.releaseSlot(reservation);
      }
      throw error;
    }

    return bookings.length;
  }

  /**
   * Calculate required cleaners based on service type and property details
   */
  private calculateRequiredCleaners(subscription: any): number {
    const { serviceType, bedrooms, rooms, floors } = subscription;

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

  /**
   * Count how many weeks of future bookings exist for a subscription
   */
  private async countFutureBookingWeeks(subscriptionId: string): Promise<number> {
    const today = DateUtils.todayInMaldives();

    // Get all future bookings for this subscription
    const futureBookings = await this.prisma.booking.findMany({
      where: {
        subscriptionId,
        date: {
          gte: today,
        },
        status: {
          not: 'CANCELED',
        },
      },
      orderBy: {
        date: 'asc',
      },
      select: {
        date: true,
      },
    });

    if (futureBookings.length === 0) {
      return 0;
    }

    // Calculate weeks between first and last booking
    const firstBooking = futureBookings[0].date;
    const lastBooking = futureBookings[futureBookings.length - 1].date;

    return Math.ceil(differenceInWeeks(lastBooking, firstBooking)) + 1;
  }

  /**
   * Renew a subscription after payment verification
   */
  async renewSubscription(subscriptionId: string, paymentId: string) {
    const subscription = await this.findOne(subscriptionId);

    // Verify subscription is active or expired (can renew expired subscriptions)
    const renewableStatuses: SubscriptionStatus[] = [SubscriptionStatus.ACTIVE, SubscriptionStatus.EXPIRED];
    if (!renewableStatuses.includes(subscription.status)) {
      throw new BadRequestException('Only active or expired subscriptions can be renewed');
    }

    // Count existing future booking weeks
    const existingWeeks = await this.countFutureBookingWeeks(subscriptionId);
    const weeksToGenerate = Math.max(0, 12 - existingWeeks);

    // Generate additional bookings to reach 12 weeks
    if (weeksToGenerate > 0) {
      await this.generateBookingsForSubscription(subscription, weeksToGenerate);
    }

    // Get the last paid booking date for nextBillingDate
    const lastPaidBooking = await this.prisma.booking.findFirst({
      where: {
        subscriptionId,
        paymentStatus: 'PAID',
      },
      orderBy: { date: 'desc' },
    });

    // Update subscription
    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.ACTIVE,
        nextBillingDate: lastPaidBooking?.date || addMonths(subscription.nextBillingDate, 1),
        lastPaymentId: paymentId,
        lastPaymentDate: DateUtils.nowInMaldives(),
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
      },
    });

    this.logger.log(
      `Renewed subscription ${subscriptionId}, generated ${weeksToGenerate} additional weeks of bookings`,
    );

    return updated;
  }

  /**
   * Expire a subscription and cancel all future bookings
   */
  async expireSubscription(subscriptionId: string) {
    const subscription = await this.findOne(subscriptionId);

    if (subscription.status === SubscriptionStatus.EXPIRED) {
      throw new BadRequestException('Subscription is already expired');
    }

    const today = DateUtils.todayInMaldives();

    // Delete unpaid future bookings (placeholders that shouldn't show in history)
    const deletedBookings = await this.prisma.booking.deleteMany({
      where: {
        subscriptionId,
        date: { gte: today },
        paymentStatus: PaymentStatus.PENDING,
        status: { not: BookingStatus.CANCELED },
      },
    });

    // Cancel paid future bookings (keep in history)
    const canceledBookings = await this.prisma.booking.updateMany({
      where: {
        subscriptionId,
        date: { gte: today },
        paymentStatus: { in: [PaymentStatus.PAID, PaymentStatus.VERIFIED] },
        status: { not: BookingStatus.CANCELED },
      },
      data: {
        status: BookingStatus.CANCELED,
      },
    });

    // Update subscription status
    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.EXPIRED,
        endDate: DateUtils.nowInMaldives(),
        autoRenew: false,
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
      },
    });

    this.logger.log(
      `Expired subscription ${subscriptionId}, deleted ${deletedBookings.count} unpaid bookings, canceled ${canceledBookings.count} paid bookings`,
    );

    return updated;
  }
}
