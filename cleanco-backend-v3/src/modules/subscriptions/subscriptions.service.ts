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
      timeSlotId,
      selectedDays,
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

    // Verify time slot exists
    const timeSlot = await this.prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
    });

    if (!timeSlot || !timeSlot.isActive) {
      throw new NotFoundException('Time slot not found or inactive');
    }

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

    // Set start date to tomorrow and calculate first billing date
    const startDate = startOfDay(addDays(new Date(), 1));
    const nextBillingDate = startOfDay(addMonths(startDate, 1));

    // Create subscription
    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        frequency,
        selectedDays,
        addressId,
        serviceType,
        bedrooms,
        bathrooms,
        hasPets: hasPets || false,
        officeSize,
        floors,
        rooms,
        timeSlotId,
        monthlyPrice,
        nextBillingDate,
        startDate,
        status: SubscriptionStatus.ACTIVE,
        autoRenew: true,
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

    this.logger.log(`Created subscription ${subscription.id} for user ${userId}`);

    // Generate 12 weeks of bookings
    await this.generateBookingsForSubscription(subscription, 12);

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
   * Cancel a subscription
   */
  async cancel(id: string, userId: string) {
    const subscription = await this.findOne(id, userId);

    if (subscription.status === SubscriptionStatus.CANCELED) {
      throw new BadRequestException('Subscription is already canceled');
    }

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

    this.logger.log(`Canceled subscription ${id}`);

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

    // Calculate sessions per month based on frequency
    const sessionsPerMonth = {
      [SubscriptionFrequency.ONCE_A_WEEK]: 4,
      [SubscriptionFrequency.TWICE_A_WEEK]: 8,
      [SubscriptionFrequency.THRICE_A_WEEK]: 12,
    };

    const monthlyPrice = Number(pricingRule.price) * sessionsPerMonth[frequency];

    return monthlyPrice;
  }

  /**
   * Generate bookings for a subscription
   * Creates bookings for the specified number of weeks based on selectedDays
   */
  private async generateBookingsForSubscription(
    subscription: any,
    weeksToGenerate: number,
  ) {
    const bookings = [];
    const today = new Date();

    // Get pricing per session
    const sessionsPerMonth: Record<SubscriptionFrequency, number> = {
      [SubscriptionFrequency.ONCE_A_WEEK]: 4,
      [SubscriptionFrequency.TWICE_A_WEEK]: 8,
      [SubscriptionFrequency.THRICE_A_WEEK]: 12,
    };
    const pricePerSession = Number(subscription.monthlyPrice) / sessionsPerMonth[subscription.frequency as SubscriptionFrequency];

    // Get next booking number
    let bookingCounter = 0;

    // Generate bookings for each week
    for (let week = 0; week < weeksToGenerate; week++) {
      const weekStart = addWeeks(subscription.startDate, week);

      // Create booking for each selected day in this week
      for (const dayOfWeek of subscription.selectedDays) {
        // Calculate the actual date for this day in this week
        const bookingDate = setDay(weekStart, dayOfWeek, { weekStartsOn: 0 }); // 0 = Sunday

        // Only create bookings for future dates
        if (bookingDate > today) {
          const bookingNumber = `BK${Date.now()}${bookingCounter++}`;

          bookings.push({
            bookingNumber,
            userId: subscription.userId,
            addressId: subscription.addressId,
            serviceType: subscription.serviceType,
            bookingType: BookingType.SUBSCRIPTION,
            timeSlotId: subscription.timeSlotId,
            date: startOfDay(bookingDate),
            totalPrice: pricePerSession,
            finalPrice: pricePerSession,
            bedrooms: subscription.bedrooms,
            bathrooms: subscription.bathrooms,
            hasPets: subscription.hasPets,
            officeSize: subscription.officeSize,
            floors: subscription.floors,
            rooms: subscription.rooms,
            subscriptionId: subscription.id,
            status: BookingStatus.PENDING,
            paymentStatus: PaymentStatus.PENDING,
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
        } catch (error) {
          this.logger.error(`Auto-assignment failed for subscription booking ${booking.id}: ${error.message}`);
          // Don't fail the subscription creation if auto-assignment fails
        }
      }
    }

    return bookings.length;
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

    // Update subscription
    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.ACTIVE,
        nextBillingDate: addMonths(subscription.nextBillingDate, 1),
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

    // Cancel all future bookings
    const today = startOfDay(new Date());
    const canceledBookings = await this.prisma.booking.updateMany({
      where: {
        subscriptionId,
        date: {
          gte: today,
        },
        status: {
          not: 'CANCELED',
        },
      },
      data: {
        status: 'CANCELED',
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
      `Expired subscription ${subscriptionId}, canceled ${canceledBookings.count} future bookings`,
    );

    return updated;
  }
}
