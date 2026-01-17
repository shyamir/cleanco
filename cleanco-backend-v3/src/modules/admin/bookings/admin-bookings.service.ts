import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { BookingsService } from '../../bookings/bookings.service';
import { BookingLockService } from '../../../common/services/booking-lock.service';
import { CleanerAssignmentService } from '../../cleaner-assignment/cleaner-assignment.service';
import { ServicesService } from '../../services/services.service';
import { AdminBookingsQueryDto } from './dto/admin-bookings-query.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { ConfirmInspectionDto } from './dto/confirm-inspection.dto';
import { AdminCreateBookingDto } from './dto/admin-create-booking.dto';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { RescheduleBookingDto } from '../../bookings/dto/reschedule-booking.dto';
import { CreateAddressDto } from '../../addresses/dto/create-address.dto';
import {
  BookingStatus,
  PaymentStatus,
  PaymentMethod,
  ServiceType,
  BookingType,
  SubscriptionStatus,
  SubscriptionFrequency,
  UserRole,
} from '@prisma/client';
import { DateUtils } from '../../../common/utils/date.utils';
import { nanoid } from 'nanoid';
import { addDays, addWeeks, isBefore } from 'date-fns';

@Injectable()
export class AdminBookingsService {
  private readonly logger = new Logger(AdminBookingsService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => BookingsService))
    private bookingsService: BookingsService,
    private bookingLockService: BookingLockService,
    private cleanerAssignmentService: CleanerAssignmentService,
    private servicesService: ServicesService,
  ) {}

  /**
   * Get all bookings with filtering and pagination
   */
  async findAll(query: AdminBookingsQueryDto) {
    const {
      status,
      serviceType,
      userId,
      dateFrom,
      dateTo,
      bookingNumber,
      page = 1,
      limit = 20,
    } = query;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (serviceType) {
      where.serviceType = serviceType;
    }

    if (userId) {
      where.userId = userId;
    }

    if (bookingNumber) {
      where.bookingNumber = {
        contains: bookingNumber,
        mode: 'insensitive',
      };
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = DateUtils.parseDateAsMaldives(dateFrom);
      }
      if (dateTo) {
        where.date.lte = DateUtils.parseDateAsMaldives(dateTo);
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get bookings and total count
    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
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
          timeSlot: true,
          cleanerAssignments: {
            include: {
              cleaner: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      phoneNumber: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: bookings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single booking by ID (admin can see any booking)
   */
  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
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
        address: true,
        timeSlot: true,
        cleanerAssignments: {
          include: {
            cleaner: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phoneNumber: true,
                  },
                },
              },
            },
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
   * Update booking status
   */
  async updateStatus(id: string, updateStatusDto: UpdateBookingStatusDto) {
    const { status, notes } = updateStatusDto;

    // Check if booking exists
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Validate status transitions
    if (booking.status === 'CANCELED' && status !== 'CANCELED') {
      throw new BadRequestException('Cannot change status of canceled booking');
    }

    if (booking.status === 'COMPLETED' && status !== 'COMPLETED') {
      throw new BadRequestException('Cannot change status of completed booking');
    }

    // Update booking status
    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: {
        status,
        adminApproved: status === 'CONFIRMED' ? true : booking.adminApproved,
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
        timeSlot: true,
      },
    });

    return {
      message: `Booking status updated to ${status}`,
      booking: updatedBooking,
    };
  }

  /**
   * Delete a booking (admin force delete)
   */
  async remove(id: string) {
    // Check if booking exists
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Delete the booking
    await this.prisma.booking.delete({
      where: { id },
    });

    return {
      message: 'Booking deleted successfully',
      bookingNumber: booking.bookingNumber,
    };
  }

  /**
   * Get booking statistics
   */
  async getStatistics() {
    const [
      totalBookings,
      pendingBookings,
      pendingInspectionBookings,
      confirmedBookings,
      completedBookings,
      canceledBookings,
    ] = await Promise.all([
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { status: 'PENDING' } }),
      this.prisma.booking.count({ where: { status: 'PENDING_INSPECTION' } }),
      this.prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      this.prisma.booking.count({ where: { status: 'COMPLETED' } }),
      this.prisma.booking.count({ where: { status: 'CANCELED' } }),
    ]);

    return {
      total: totalBookings,
      pending: pendingBookings,
      pendingInspection: pendingInspectionBookings,
      confirmed: confirmedBookings,
      completed: completedBookings,
      canceled: canceledBookings,
    };
  }

  /**
   * Get all bookings pending inspection (office bookings)
   */
  async findPendingInspection() {
    return this.prisma.booking.findMany({
      where: {
        status: BookingStatus.PENDING_INSPECTION,
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
        timeSlot: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Confirm price after inspection
   * Admin can increase, decrease, or confirm the estimated price
   */
  async confirmInspection(
    bookingId: string,
    adminId: string,
    confirmDto: ConfirmInspectionDto,
  ) {
    const { confirmedPrice, priceAdjustmentReason } = confirmDto;

    // Find the booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Validate booking is pending inspection
    if (booking.status !== 'PENDING_INSPECTION') {
      throw new BadRequestException(
        'Booking is not pending inspection. Current status: ' + booking.status,
      );
    }

    // Calculate final price after discount
    const discountAmount = Number(booking.discountAmount) || 0;
    const finalPrice = confirmedPrice - discountAmount;

    // Update booking with confirmed price
    // Set status to ASSIGNED since cleaners are already assigned during booking creation
    // Also set paymentStatus to PAID so it appears in activity
    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.ASSIGNED,
        paymentStatus: PaymentStatus.PAID,
        confirmedPrice,
        totalPrice: confirmedPrice,
        finalPrice: Math.max(0, finalPrice),
        priceAdjustmentReason,
        inspectedAt: DateUtils.nowInMaldives(),
        inspectedBy: adminId,
        adminApproved: true,
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
        timeSlot: true,
      },
    });

    return {
      message: 'Inspection confirmed and price updated',
      booking: updatedBooking,
      priceChange: {
        estimatedPrice: Number(booking.estimatedPrice),
        confirmedPrice,
        difference: confirmedPrice - Number(booking.estimatedPrice || 0),
      },
    };
  }

  /**
   * Admin reschedule booking (no 24-hour restriction, no reschedule limit)
   */
  async rescheduleBooking(bookingId: string, rescheduleDto: RescheduleBookingDto) {
    return this.bookingsService.adminRescheduleBooking(bookingId, rescheduleDto);
  }

  /**
   * Admin cancel booking (releases slot capacity and removes cleaner assignments)
   */
  async cancelBooking(bookingId: string, cancelReason?: string) {
    return this.bookingsService.adminCancelBooking(bookingId, cancelReason);
  }

  // ===== ADMIN CREATE BOOKING METHODS =====

  /**
   * Create a new customer (admin)
   */
  async createUser(dto: AdminCreateUserDto) {
    // Check if phone number already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (existingUser) {
      throw new BadRequestException('A user with this phone number already exists');
    }

    // Create the user as a CUSTOMER
    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber,
        email: dto.email,
        role: UserRole.CUSTOMER,
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      message: 'Customer created successfully',
      user,
    };
  }

  /**
   * Get all addresses for a specific user (admin)
   */
  async getUserAddresses(userId: string) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });

    return addresses;
  }

  /**
   * Create address for a user (admin)
   */
  async createAddressForUser(userId: string, dto: CreateAddressDto) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if this is the first address for the user
    const existingAddresses = await this.prisma.address.count({
      where: { userId },
    });

    // If this is the first address, make it primary by default
    const isPrimary = existingAddresses === 0;

    const address = await this.prisma.address.create({
      data: {
        ...dto,
        userId,
        isPrimary,
      },
    });

    return address;
  }

  /**
   * Admin create booking for a user (one-time or subscription)
   */
  async createBooking(dto: AdminCreateBookingDto) {
    let userId = dto.userId;

    // If newUser provided, create the user first
    if (dto.newUser) {
      const result = await this.createUser({
        firstName: dto.newUser.firstName,
        lastName: dto.newUser.lastName,
        phoneNumber: dto.newUser.phoneNumber,
      });
      userId = result.user.id;
    }

    if (!userId) {
      throw new BadRequestException('Either userId or newUser must be provided');
    }

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify address exists and belongs to user
    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId },
    });

    if (!address) {
      throw new BadRequestException('Address not found or does not belong to this user');
    }

    // Check if this is a subscription or one-time booking
    const isSubscription = dto.frequency !== 'Once';

    if (isSubscription) {
      return this.createSubscriptionBooking(userId, dto, address);
    } else {
      return this.createOneTimeBooking(userId, dto, address);
    }
  }

  /**
   * Create a one-time booking (admin)
   */
  private async createOneTimeBooking(userId: string, dto: AdminCreateBookingDto, address: any) {
    // Validate date and time slot
    if (!dto.date || !dto.timeSlotId) {
      throw new BadRequestException('Date and timeSlotId are required for one-time bookings');
    }

    const bookingDate = DateUtils.parseDateAsMaldives(dto.date);
    const today = DateUtils.todayInMaldives();

    if (isBefore(DateUtils.startOfDayInMaldives(bookingDate), today)) {
      throw new BadRequestException('Cannot book for past dates');
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

    const isOfficeBooking = dto.serviceType === ServiceType.OFFICE;

    // Reserve slot in AvailabilityCache
    await this.bookingLockService.reserveSlot({
      date: bookingDate,
      timeSlotId: dto.timeSlotId,
      requiredCapacity: requiredCleaners,
    });

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
            bookingType: BookingType.ONE_TIME,
            status: isOfficeBooking ? BookingStatus.PENDING_INSPECTION : BookingStatus.CONFIRMED,
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
            paymentStatus: PaymentStatus.PAID,
            specialInstructions: dto.specialInstructions,
            adminApproved: true,
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

    return {
      message: 'Booking created successfully',
      booking,
    };
  }

  /**
   * Create a subscription booking (admin)
   */
  private async createSubscriptionBooking(userId: string, dto: AdminCreateBookingDto, address: any) {
    // Validate subscription data
    if (!dto.startDate || !dto.daySlots || dto.daySlots.length === 0) {
      throw new BadRequestException('startDate and daySlots are required for subscription bookings');
    }

    // Parse frequency
    const frequencyMap: Record<string, SubscriptionFrequency> = {
      '1x /week': SubscriptionFrequency.ONCE_A_WEEK,
      '2x /week': SubscriptionFrequency.TWICE_A_WEEK,
      '3x /week': SubscriptionFrequency.THRICE_A_WEEK,
    };

    const frequency = frequencyMap[dto.frequency];
    if (!frequency) {
      throw new BadRequestException(`Invalid frequency: ${dto.frequency}`);
    }

    // Validate day slots count matches frequency
    const expectedDays = frequency === SubscriptionFrequency.ONCE_A_WEEK ? 1 :
                        frequency === SubscriptionFrequency.TWICE_A_WEEK ? 2 : 3;

    if (dto.daySlots.length !== expectedDays) {
      throw new BadRequestException(`Frequency ${dto.frequency} requires exactly ${expectedDays} day slot(s)`);
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

    const selectedDays = dto.daySlots.map((ds) => ds.dayOfWeek);
    const startDate = DateUtils.parseDateAsMaldives(dto.startDate);
    const today = DateUtils.todayInMaldives();

    if (isBefore(startDate, today)) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    // Calculate price
    const priceInfo = await this.calculateSubscriptionPrice(dto);

    // Calculate required cleaners
    const requiredCleaners = this.calculateRequiredCleaners({
      serviceType: dto.serviceType,
      bedrooms: dto.bedrooms,
      rooms: dto.rooms,
      floors: dto.floors,
    });

    // Create subscription
    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        frequency,
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
            dayOfWeek: ds.dayOfWeek,
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
    await this.generateBookingsForSubscription(subscription, 12, requiredCleaners, dto.paymentMethod);

    return {
      message: 'Subscription created successfully',
      subscription,
    };
  }

  /**
   * Generate bookings for subscription (admin version)
   */
  private async generateBookingsForSubscription(
    subscription: any,
    weeksToGenerate: number,
    requiredCleaners: number,
    paymentMethod?: PaymentMethod,
  ) {
    const bookings = [];
    const reservations = [];

    // Build a map of dayOfWeek to timeSlotId
    const dayTimeMap = new Map<number, string>();
    for (const ds of subscription.daySlots) {
      dayTimeMap.set(ds.dayOfWeek, ds.timeSlotId);
    }

    const isOfficeBooking = subscription.serviceType === ServiceType.OFFICE;

    let paidBookingsCreated = 0;
    const paidSessionsTarget = 4;

    for (let week = 0; week < weeksToGenerate; week++) {
      const weekStart = addWeeks(subscription.startDate, week);

      for (const day of subscription.selectedDays.sort((a: number, b: number) => a - b)) {
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
          squareFeet: subscription.squareFeet,
          floors: subscription.floors,
          rooms: subscription.rooms,
          toilets: subscription.toilets,
          totalPrice: subscription.monthlyPrice / 4,
          finalPrice: subscription.monthlyPrice / 4,
          subscriptionId: subscription.id,
          paymentStatus: isPaid ? PaymentStatus.PAID : PaymentStatus.PENDING,
          paymentMethod,
          adminApproved: true,
        });
      }
    }

    // Reserve all slots
    if (reservations.length > 0) {
      await this.bookingLockService.reserveMultipleSlots(reservations);
    }

    // Create all bookings
    for (const bookingData of bookings) {
      const created = await this.prisma.booking.create({ data: bookingData });

      // Auto-assign cleaners for paid bookings
      if (bookingData.paymentStatus === PaymentStatus.PAID) {
        try {
          await this.cleanerAssignmentService.autoAssignCleaners(created.id);
        } catch (error) {
          this.logger.error(`Auto-assignment failed for booking ${created.id}`);
        }
      }
    }

    return bookings.length;
  }

  /**
   * Calculate price for a booking
   */
  private async calculateBookingPrice(dto: AdminCreateBookingDto, userId: string) {
    let discountAmount = 0;
    let promoCodeId: string | null = null;

    const quote = await this.servicesService.calculateQuote({
      serviceType: dto.serviceType,
      frequency: undefined,
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
   * Calculate price for a subscription
   */
  private async calculateSubscriptionPrice(dto: AdminCreateBookingDto) {
    // Convert frequency string to enum
    const frequencyMap: Record<string, SubscriptionFrequency> = {
      '1x /week': SubscriptionFrequency.ONCE_A_WEEK,
      '2x /week': SubscriptionFrequency.TWICE_A_WEEK,
      '3x /week': SubscriptionFrequency.THRICE_A_WEEK,
    };
    const frequency = frequencyMap[dto.frequency];

    const quote = await this.servicesService.calculateQuote({
      serviceType: dto.serviceType,
      frequency,
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
