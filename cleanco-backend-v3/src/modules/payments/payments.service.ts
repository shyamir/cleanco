import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBankTransferPaymentDto } from './dto/create-bank-transfer-payment.dto';
import { InitiateBmlPaymentDto } from './dto/initiate-bml-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { CreateSubscriptionBankTransferPaymentDto } from './dto/create-subscription-bank-transfer-payment.dto';
import { InitiateSubscriptionBmlPaymentDto } from './dto/initiate-subscription-bml-payment.dto';
import { PaymentMethod, PaymentStatus, BookingStatus } from '@prisma/client';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => SubscriptionsService))
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  /**
   * Create a bank transfer payment with receipt
   */
  async createBankTransferPayment(
    userId: string,
    dto: CreateBankTransferPaymentDto,
  ) {
    // Verify booking exists and belongs to user
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { user: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.userId !== userId) {
      throw new ForbiddenException('Access denied to this booking');
    }

    // Check if payment already exists for this booking
    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        bookingId: dto.bookingId,
        status: { in: [PaymentStatus.PENDING, PaymentStatus.PAID, PaymentStatus.VERIFIED] },
      },
    });

    if (existingPayment) {
      throw new BadRequestException('Payment already exists for this booking');
    }

    // Create bank transfer payment
    const payment = await this.prisma.payment.create({
      data: {
        bookingId: dto.bookingId,
        amount: booking.finalPrice,
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PAID,
        receiptUrl: dto.receiptUrl,
        paidAt: new Date(),
      },
      include: {
        booking: {
          include: {
            user: true,
            address: true,
            timeSlot: true,
          },
        },
      },
    });

    // Update booking payment status
    await this.prisma.booking.update({
      where: { id: dto.bookingId },
      data: { paymentStatus: PaymentStatus.PAID },
    });

    return payment;
  }

  /**
   * Initiate BML payment gateway transaction
   */
  async initiateBmlPayment(userId: string, dto: InitiateBmlPaymentDto) {
    // Verify booking exists and belongs to user
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { user: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.userId !== userId) {
      throw new ForbiddenException('Access denied to this booking');
    }

    // Check if payment already exists for this booking
    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        bookingId: dto.bookingId,
        status: { in: [PaymentStatus.PENDING, PaymentStatus.PAID, PaymentStatus.VERIFIED] },
      },
    });

    if (existingPayment) {
      throw new BadRequestException('Payment already exists for this booking');
    }

    // TODO: Integrate with actual BML payment gateway
    // For now, create a pending BML payment
    const payment = await this.prisma.payment.create({
      data: {
        bookingId: dto.bookingId,
        amount: booking.finalPrice,
        method: PaymentMethod.BML_GATEWAY,
        status: PaymentStatus.PENDING,
        transactionId: `BML-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      },
      include: {
        booking: {
          include: {
            user: true,
            address: true,
            timeSlot: true,
          },
        },
      },
    });

    return {
      payment,
      paymentUrl: `https://bml.gateway.example.com/pay/${payment.transactionId}`, // Placeholder URL
      message: 'BML payment initiated. Please complete payment at the provided URL.',
    };
  }

  /**
   * Create a bank transfer payment for subscription renewal
   */
  async createSubscriptionBankTransferPayment(
    userId: string,
    dto: CreateSubscriptionBankTransferPaymentDto,
  ) {
    // Verify subscription exists and belongs to user
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: dto.subscriptionId },
      include: { user: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.userId !== userId) {
      throw new ForbiddenException('Access denied to this subscription');
    }

    // Check if payment already exists for this subscription in current billing cycle
    // Check for any payment in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        subscriptionId: dto.subscriptionId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
        status: { in: [PaymentStatus.PENDING, PaymentStatus.PAID, PaymentStatus.VERIFIED] },
      },
    });

    if (existingPayment) {
      throw new BadRequestException('Payment already exists for this subscription billing cycle');
    }

    // Create bank transfer payment for subscription
    const payment = await this.prisma.payment.create({
      data: {
        subscriptionId: dto.subscriptionId,
        amount: subscription.monthlyPrice,
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PAID,
        receiptUrl: dto.receiptUrl,
        paidAt: new Date(),
      },
      include: {
        subscription: {
          include: {
            user: true,
          },
        },
      },
    });

    return payment;
  }

  /**
   * Initiate BML payment for subscription renewal
   */
  async initiateSubscriptionBmlPayment(
    userId: string,
    dto: InitiateSubscriptionBmlPaymentDto,
  ) {
    // Verify subscription exists and belongs to user
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: dto.subscriptionId },
      include: { user: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.userId !== userId) {
      throw new ForbiddenException('Access denied to this subscription');
    }

    // Check if payment already exists for this subscription in current billing cycle
    // Check for any payment in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        subscriptionId: dto.subscriptionId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
        status: { in: [PaymentStatus.PENDING, PaymentStatus.PAID, PaymentStatus.VERIFIED] },
      },
    });

    if (existingPayment) {
      throw new BadRequestException('Payment already exists for this subscription billing cycle');
    }

    // TODO: Integrate with actual BML payment gateway
    // For now, create a pending BML payment for subscription
    const payment = await this.prisma.payment.create({
      data: {
        subscriptionId: dto.subscriptionId,
        amount: subscription.monthlyPrice,
        method: PaymentMethod.BML_GATEWAY,
        status: PaymentStatus.PENDING,
        transactionId: `BML-SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      },
      include: {
        subscription: {
          include: {
            user: true,
          },
        },
      },
    });

    return {
      payment,
      paymentUrl: `https://bml.gateway.example.com/pay/${payment.transactionId}`, // Placeholder URL
      message: 'BML subscription payment initiated. Please complete payment at the provided URL.',
    };
  }

  /**
   * Get all payments for authenticated user
   */
  async findUserPayments(userId: string) {
    return await this.prisma.payment.findMany({
      where: {
        booking: {
          userId,
        },
      },
      include: {
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            serviceType: true,
            date: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get specific payment by ID
   */
  async findOne(paymentId: string, userId?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            user: true,
            address: true,
            timeSlot: true,
          },
        },
        subscription: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // If userId is provided (customer request), verify ownership
    if (userId) {
      // Check booking ownership if payment is for a booking
      if (payment.booking && payment.booking.userId !== userId) {
        throw new ForbiddenException('Access denied to this payment');
      }

      // Check subscription ownership if payment is for a subscription
      if (payment.subscription && payment.subscription.userId !== userId) {
        throw new ForbiddenException('Access denied to this payment');
      }
    }

    return payment;
  }

  /**
   * Admin: Get all payments with optional filters
   */
  async findAll(status?: PaymentStatus, method?: PaymentMethod) {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (method) {
      where.method = method;
    }

    return await this.prisma.payment.findMany({
      where,
      include: {
        booking: {
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
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Admin: Verify a payment
   */
  async verifyPayment(paymentId: string, adminId: string, dto: VerifyPaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true, subscription: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Only bank transfer payments can be manually verified
    if (payment.method !== PaymentMethod.BANK_TRANSFER) {
      throw new BadRequestException('Only bank transfer payments can be manually verified');
    }

    // Update payment status
    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: dto.status,
        verifiedAt: dto.status === PaymentStatus.VERIFIED ? new Date() : null,
        verifiedBy: dto.status === PaymentStatus.VERIFIED ? adminId : null,
        failureReason: dto.failureReason,
      },
      include: {
        booking: {
          include: {
            user: true,
            address: true,
            timeSlot: true,
          },
        },
        subscription: {
          include: {
            user: true,
          },
        },
      },
    });

    // Handle booking payment verification
    if (payment.bookingId && dto.status === PaymentStatus.VERIFIED) {
      await this.prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          paymentStatus: PaymentStatus.VERIFIED,
          status: BookingStatus.CONFIRMED,
          adminApproved: true,
        },
      });
    } else if (payment.bookingId && dto.status === PaymentStatus.FAILED) {
      await this.prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          paymentStatus: PaymentStatus.FAILED,
        },
      });
    }

    // Handle subscription payment verification and renewal
    if (payment.subscriptionId && dto.status === PaymentStatus.VERIFIED) {
      await this.subscriptionsService.renewSubscription(payment.subscriptionId, paymentId);
    }

    return updatedPayment;
  }

  /**
   * Handle BML payment callback (webhook)
   * This would be called by BML gateway after payment completion
   */
  async handleBmlCallback(transactionId: string, bmlData: any) {
    const payment = await this.prisma.payment.findUnique({
      where: { transactionId },
      include: { booking: true, subscription: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Update payment based on BML response
    const isSuccess = bmlData.status === 'SUCCESS'; // Adjust based on actual BML response
    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: isSuccess ? PaymentStatus.VERIFIED : PaymentStatus.FAILED,
        bmlResponse: bmlData,
        verifiedAt: isSuccess ? new Date() : null,
        paidAt: isSuccess ? new Date() : null,
        failureReason: isSuccess ? null : bmlData.failureReason,
      },
    });

    // Handle booking payment
    if (payment.bookingId) {
      if (isSuccess) {
        await this.prisma.booking.update({
          where: { id: payment.bookingId },
          data: {
            paymentStatus: PaymentStatus.VERIFIED,
            status: BookingStatus.CONFIRMED,
          },
        });
      } else {
        await this.prisma.booking.update({
          where: { id: payment.bookingId },
          data: {
            paymentStatus: PaymentStatus.FAILED,
          },
        });
      }
    }

    // Handle subscription payment and renewal
    if (payment.subscriptionId && isSuccess) {
      await this.subscriptionsService.renewSubscription(payment.subscriptionId, payment.id);
    }

    return updatedPayment;
  }
}
