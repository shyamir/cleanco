import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CleanerAssignmentService } from '../cleaner-assignment/cleaner-assignment.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { ServiceType, SubscriptionFrequency, SubscriptionStatus, BookingType, BookingStatus, PaymentStatus } from '@prisma/client';
import { addMonths, startOfDay, addDays, addWeeks, getDay, setDay, differenceInWeeks } from 'date-fns';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cleanerAssignmentService: CleanerAssignmentService,
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
      bedrooms,
      bathrooms,
      hasPets,
      officeSize,
      floors,
      rooms,
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
    const timeSlots = await this.prisma.timeSlot.findMany({
      where: { id: { in: timeSlotIds } },
    });

    if (timeSlots.length !== timeSlotIds.length) {
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

    // Set start date to tomorrow
    const startDate = startOfDay(addDays(new Date(), 1));

    // Create subscription with daySlots relation
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

    const today = startOfDay(new Date());

    // Get all future bookings for this subscription that are not already canceled
    const futureBookings = await this.prisma.booking.findMany({
      where: {
        subscriptionId: id,
        date: { gte: today },
        status: { not: BookingStatus.CANCELED },
      },
      include: {
        cleanerAssignments: true,
      },
    });

    // Update availability cache for each booking being canceled
    for (const booking of futureBookings) {
      const assignedCount = booking.cleanerAssignments.length;
      if (assignedCount > 0) {
        // Decrease booked capacity (negative count)
        await this.updateAvailabilityCache(booking.date, booking.timeSlotId, -assignedCount);
      }
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

    // Cancel paid future bookings (keep in history)
    const canceledBookings = await this.prisma.booking.updateMany({
      where: {
        subscriptionId: id,
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
      where: { id },
      data: {
        status: SubscriptionStatus.CANCELED,
        endDate: new Date(),
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

    this.logger.log(`Canceled subscription ${id}, deleted ${deletedBookings.count} unpaid bookings, canceled ${canceledBookings.count} paid bookings`);

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
   */
  private async calculateMonthlyPrice(
    serviceType: ServiceType,
    frequency: SubscriptionFrequency,
    bedrooms?: number,
    officeSize?: string,
    floors?: number,
    rooms?: number,
  ): Promise<number> {
    // Find pricing rule
    const pricingRule = await this.prisma.pricingRule.findFirst({
      where: {
        serviceType,
        frequency,
        ...(serviceType === ServiceType.HOME && {
          bedrooms,
        }),
        ...(serviceType === ServiceType.OFFICE && {
          officeSize,
          floors,
          rooms,
        }),
        isActive: true,
      },
    });

    if (!pricingRule) {
      throw new NotFoundException('No pricing rule found for the provided parameters');
    }

    // pricingRule.price is already the monthly price for subscription frequencies
    return Number(pricingRule.price);
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
    const today = new Date();

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

    // Get next booking number and track paid sessions
    let bookingCounter = 0;
    let paidBookingsCreated = 0;

    // Generate bookings for each week
    for (let week = 0; week < weeksToGenerate; week++) {
      const weekStart = addWeeks(subscription.startDate, week);

      // Create booking for each selected day in this week
      for (const dayOfWeek of subscription.selectedDays) {
        // Calculate the actual date for this day in this week
        const bookingDate = setDay(weekStart, dayOfWeek, { weekStartsOn: 0 }); // 0 = Sunday

        // Get the time slot for this day (from daySlots or fallback)
        const timeSlotId = dayToTimeSlot[dayOfWeek] || fallbackTimeSlotId;

        // Only create bookings for future dates
        if (bookingDate > today && timeSlotId) {
          const bookingNumber = `BK${Date.now()}${bookingCounter++}`;

          // First month's worth of bookings are PAID, rest are PENDING (placeholders)
          const isPaidBooking = paidBookingsCreated < paidSessionsCount;
          if (isPaidBooking) {
            paidBookingsCreated++;
          }

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
            date: startOfDay(bookingDate),
            totalPrice: subscriptionPrice,
            finalPrice: subscriptionPrice,
            bedrooms: subscription.bedrooms,
            bathrooms: subscription.bathrooms,
            hasPets: subscription.hasPets,
            officeSize: subscription.officeSize,
            floors: subscription.floors,
            rooms: subscription.rooms,
            subscriptionId: subscription.id,
            status: BookingStatus.PENDING,
            paymentStatus: isPaidBooking ? PaymentStatus.PAID : PaymentStatus.PENDING,
            adminApproved: false,
          });
        }
      }
    }

    // Create all bookings in a single transaction
    if (bookings.length > 0) {
      await this.prisma.booking.createMany({
        data: bookings,
      });

      this.logger.log(`Generated ${bookings.length} bookings for subscription ${subscription.id}`);

      // Auto-assign cleaners to the newly created bookings
      const createdBookings = await this.prisma.booking.findMany({
        where: {
          subscriptionId: subscription.id,
          date: { gte: startOfDay(new Date()) },
          status: BookingStatus.PENDING,
        },
        orderBy: { date: 'asc' },
      });

      for (const booking of createdBookings) {
        try {
          await this.cleanerAssignmentService.autoAssignCleaners(booking.id);

          // Update availability cache based on assigned cleaners
          const assignedCount = await this.getAssignedCleanersCount(booking.id);
          if (assignedCount > 0) {
            await this.updateAvailabilityCache(booking.date, booking.timeSlotId, assignedCount);
          }
        } catch (error) {
          this.logger.error(`Auto-assignment failed for subscription booking ${booking.id}: ${error.message}`);
          // Don't fail the subscription creation if auto-assignment fails
        }
      }
    }

    return bookings.length;
  }

  /**
   * Get count of cleaners assigned to a booking
   */
  private async getAssignedCleanersCount(bookingId: string): Promise<number> {
    return this.prisma.cleanerAssignment.count({
      where: { bookingId },
    });
  }

  /**
   * Calculate total available cleaners for a given date
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
      await this.prisma.availabilityCache.update({
        where: { id: existingCache.id },
        data: {
          bookedCapacity: Math.max(0, existingCache.bookedCapacity + cleanerCount),
        },
      });
    } else {
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

  /**
   * Count how many weeks of future bookings exist for a subscription
   */
  private async countFutureBookingWeeks(subscriptionId: string): Promise<number> {
    const today = startOfDay(new Date());

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
        lastPaymentDate: new Date(),
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

    const today = startOfDay(new Date());

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
        endDate: new Date(),
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
