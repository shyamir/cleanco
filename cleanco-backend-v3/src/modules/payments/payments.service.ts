import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBankTransferPaymentDto } from './dto/create-bank-transfer-payment.dto';
import { InitiateBmlPaymentDto } from './dto/initiate-bml-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { CreateSubscriptionBankTransferPaymentDto } from './dto/create-subscription-bank-transfer-payment.dto';
import { InitiateSubscriptionBmlPaymentDto } from './dto/initiate-subscription-bml-payment.dto';
import { PaymentMethod, PaymentStatus, BookingStatus } from '@prisma/client';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { BmlService } from '../bml/bml.service';
import { BmlTransactionState } from '../bml/dto/bml-transaction.dto';
import { DateUtils } from '../../common/utils/date.utils';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => SubscriptionsService))
    private readonly subscriptionsService: SubscriptionsService,
    private readonly bmlService: BmlService,
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
        paidAt: DateUtils.nowInMaldives(),
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
    // Check if BML service is configured
    if (!this.bmlService.isConfigured()) {
      throw new BadRequestException('BML payment gateway is not configured');
    }

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

    // Create a pending payment record first
    const payment = await this.prisma.payment.create({
      data: {
        bookingId: dto.bookingId,
        amount: booking.finalPrice,
        method: PaymentMethod.BML_GATEWAY,
        status: PaymentStatus.PENDING,
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

    // Create BML transaction
    const amountInCents = Math.round(Number(booking.finalPrice) * 100);
    const bmlResult = await this.bmlService.createTransaction({
      amount: amountInCents,
      currency: 'MVR',
      localId: payment.id,
      customerReference: `Booking #${booking.bookingNumber}`,
    });

    if (!bmlResult.success || !bmlResult.transactionId || !bmlResult.paymentUrl) {
      // Delete the pending payment if BML transaction creation failed
      await this.prisma.payment.delete({ where: { id: payment.id } });
      throw new BadRequestException(bmlResult.error || 'Failed to create BML transaction');
    }

    // Update payment with BML transaction ID
    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        transactionId: bmlResult.transactionId,
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

    this.logger.log(`BML payment initiated for booking ${booking.bookingNumber}, transaction: ${bmlResult.transactionId}`);

    return {
      payment: updatedPayment,
      paymentUrl: bmlResult.paymentUrl,
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
    const thirtyDaysAgo = DateUtils.addDays(DateUtils.nowInMaldives(), -30);

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
        paidAt: DateUtils.nowInMaldives(),
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
    // Check if BML service is configured
    if (!this.bmlService.isConfigured()) {
      throw new BadRequestException('BML payment gateway is not configured');
    }

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
    const thirtyDaysAgo = DateUtils.addDays(DateUtils.nowInMaldives(), -30);

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

    // Create a pending payment record first
    const payment = await this.prisma.payment.create({
      data: {
        subscriptionId: dto.subscriptionId,
        amount: subscription.monthlyPrice,
        method: PaymentMethod.BML_GATEWAY,
        status: PaymentStatus.PENDING,
      },
      include: {
        subscription: {
          include: {
            user: true,
          },
        },
      },
    });

    // Create BML transaction
    const amountInCents = Math.round(Number(subscription.monthlyPrice) * 100);
    const bmlResult = await this.bmlService.createTransaction({
      amount: amountInCents,
      currency: 'MVR',
      localId: payment.id,
      customerReference: `Subscription renewal #${subscription.id.slice(-8)}`,
    });

    if (!bmlResult.success || !bmlResult.transactionId || !bmlResult.paymentUrl) {
      // Delete the pending payment if BML transaction creation failed
      await this.prisma.payment.delete({ where: { id: payment.id } });
      throw new BadRequestException(bmlResult.error || 'Failed to create BML transaction');
    }

    // Update payment with BML transaction ID
    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        transactionId: bmlResult.transactionId,
      },
      include: {
        subscription: {
          include: {
            user: true,
          },
        },
      },
    });

    this.logger.log(`BML payment initiated for subscription ${subscription.id}, transaction: ${bmlResult.transactionId}`);

    return {
      payment: updatedPayment,
      paymentUrl: bmlResult.paymentUrl,
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
        verifiedAt: dto.status === PaymentStatus.VERIFIED ? DateUtils.nowInMaldives() : null,
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
   * Handle BML payment redirect callback
   * This is called when BML redirects the user back after payment
   */
  async handleBmlRedirectCallback(
    transactionId: string,
    state: BmlTransactionState,
    signature: string,
  ): Promise<{ payment: any; redirectUrl: string }> {
    this.logger.log(`Processing BML callback for transaction: ${transactionId}, state: ${state}`);

    const payment = await this.prisma.payment.findUnique({
      where: { transactionId },
      include: { booking: true, subscription: true },
    });

    if (!payment) {
      this.logger.error(`Payment not found for transaction: ${transactionId}`);
      throw new NotFoundException('Payment not found');
    }

    // Determine payment status based on BML state
    const isSuccess = state === BmlTransactionState.CONFIRMED;
    const isCancelled = state === BmlTransactionState.CANCELLED;
    const newStatus = isSuccess
      ? PaymentStatus.VERIFIED
      : PaymentStatus.FAILED;

    // Update payment status
    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        bmlResponse: { transactionId, state, signature },
        verifiedAt: isSuccess ? DateUtils.nowInMaldives() : null,
        paidAt: isSuccess ? DateUtils.nowInMaldives() : null,
        failureReason: isSuccess ? null : (isCancelled ? 'Payment cancelled by user' : 'Payment failed'),
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
        this.logger.log(`Booking ${payment.bookingId} confirmed after BML payment`);
      } else {
        await this.prisma.booking.update({
          where: { id: payment.bookingId },
          data: {
            paymentStatus: PaymentStatus.FAILED,
          },
        });
        this.logger.log(`Booking ${payment.bookingId} payment failed`);
      }
    }

    // Handle subscription payment and renewal
    if (payment.subscriptionId && isSuccess) {
      await this.subscriptionsService.renewSubscription(payment.subscriptionId, payment.id);
      this.logger.log(`Subscription ${payment.subscriptionId} renewed after BML payment`);
    }

    // Generate app redirect URL
    const redirectStatus = isSuccess ? 'success' : (isCancelled ? 'cancelled' : 'failed');
    const redirectUrl = this.bmlService.getAppRedirectUrl(
      redirectStatus,
      payment.id,
      transactionId,
    );

    return { payment: updatedPayment, redirectUrl };
  }

  /**
   * Handle BML payment webhook (for async notifications)
   * This is called by BML gateway after payment completion
   */
  async handleBmlWebhook(transactionId: string, bmlData: any) {
    this.logger.log(`Processing BML webhook for transaction: ${transactionId}`);

    const payment = await this.prisma.payment.findUnique({
      where: { transactionId },
      include: { booking: true, subscription: true },
    });

    if (!payment) {
      this.logger.error(`Payment not found for transaction: ${transactionId}`);
      throw new NotFoundException('Payment not found');
    }

    // If payment is already processed, skip
    if (payment.status === PaymentStatus.VERIFIED || payment.status === PaymentStatus.FAILED) {
      this.logger.log(`Payment ${payment.id} already processed, skipping webhook`);
      return payment;
    }

    // Update payment based on BML response
    const isSuccess = bmlData.state === BmlTransactionState.CONFIRMED;
    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: isSuccess ? PaymentStatus.VERIFIED : PaymentStatus.FAILED,
        bmlResponse: bmlData,
        verifiedAt: isSuccess ? DateUtils.nowInMaldives() : null,
        paidAt: isSuccess ? DateUtils.nowInMaldives() : null,
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

  /**
   * Get payment by ID (for checking status after callback)
   */
  async getPaymentStatus(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            status: true,
          },
        },
        subscription: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }
}
