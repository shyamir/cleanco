import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreateBankTransferPaymentDto } from './dto/create-bank-transfer-payment.dto';
import { InitiateBmlPaymentDto } from './dto/initiate-bml-payment.dto';
import { CreateSubscriptionBankTransferPaymentDto } from './dto/create-subscription-bank-transfer-payment.dto';
import { InitiateSubscriptionBmlPaymentDto } from './dto/initiate-subscription-bml-payment.dto';
import { CheckoutBankTransferPaymentDto, CheckoutBmlPaymentDto } from './dto/checkout-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { BmlCallbackQueryDto, BmlWebhookDto, BmlTransactionState } from '../bml/dto/bml-transaction.dto';

@ApiTags('Customer - Payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  // ============================================
  // BML Callback Endpoints (Public - No Auth)
  // ============================================

  @Get('bml/callback')
  @Public()
  @ApiOperation({ summary: 'BML payment redirect callback (public endpoint)' })
  @ApiQuery({ name: 'transactionId', required: true })
  @ApiQuery({ name: 'state', required: true, enum: BmlTransactionState })
  @ApiQuery({ name: 'signature', required: true })
  @ApiResponse({ status: 302, description: 'Redirects to app deep link' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async handleBmlCallback(
    @Query('transactionId') transactionId: string,
    @Query('state') state: BmlTransactionState,
    @Query('signature') signature: string,
    @Res() res: Response,
  ) {
    this.logger.log(`BML callback received: transactionId=${transactionId}, state=${state}`);

    try {
      const { redirectUrl } = await this.paymentsService.handleBmlRedirectCallback(
        transactionId,
        state,
        signature,
      );

      this.logger.log(`Redirecting to: ${redirectUrl}`);
      return res.redirect(redirectUrl);
    } catch (error) {
      this.logger.error(`BML callback error: ${error.message}`);
      // Redirect to app with error status
      const errorUrl = `cleanco://payment-callback?status=error&message=${encodeURIComponent(error.message)}`;
      return res.redirect(errorUrl);
    }
  }

  @Post('bml/webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'BML payment webhook (public endpoint)' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async handleBmlWebhook(@Body() dto: BmlWebhookDto) {
    this.logger.log(`BML webhook received: transactionId=${dto.transactionId}, state=${dto.state}`);

    await this.paymentsService.handleBmlWebhook(dto.transactionId, dto);

    return { success: true };
  }

  @Get('status/:id')
  @Public()
  @ApiOperation({ summary: 'Get payment status by ID (public endpoint for callback verification)' })
  @ApiResponse({ status: 200, description: 'Payment status' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPaymentStatus(@Param('id') id: string) {
    return await this.paymentsService.getPaymentStatus(id);
  }

  // ============================================
  // Authenticated Customer Endpoints
  // ============================================

  @Post('bank-transfer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit bank transfer payment with receipt' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiResponse({ status: 400, description: 'Payment already exists or bad request' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 403, description: 'Access denied to this booking' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createBankTransferPayment(
    @GetUser('id') userId: string,
    @Body() dto: CreateBankTransferPaymentDto,
  ) {
    return await this.paymentsService.createBankTransferPayment(userId, dto);
  }

  @Post('bml')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initiate BML payment gateway transaction' })
  @ApiResponse({ status: 201, description: 'BML payment initiated' })
  @ApiResponse({ status: 400, description: 'Payment already exists or bad request' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 403, description: 'Access denied to this booking' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async initiateBmlPayment(
    @GetUser('id') userId: string,
    @Body() dto: InitiateBmlPaymentDto,
  ) {
    return await this.paymentsService.initiateBmlPayment(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all payments for the authenticated customer' })
  @ApiResponse({ status: 200, description: 'List of payments' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findMy(@GetUser('id') userId: string) {
    return await this.paymentsService.findUserPayments(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment details' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 403, description: 'Access denied to this payment' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return await this.paymentsService.findOne(id, userId);
  }

  @Post('subscription/bank-transfer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit bank transfer payment for subscription renewal' })
  @ApiResponse({ status: 201, description: 'Subscription payment created successfully' })
  @ApiResponse({ status: 400, description: 'Payment already exists or bad request' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @ApiResponse({ status: 403, description: 'Access denied to this subscription' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createSubscriptionBankTransferPayment(
    @GetUser('id') userId: string,
    @Body() dto: CreateSubscriptionBankTransferPaymentDto,
  ) {
    return await this.paymentsService.createSubscriptionBankTransferPayment(userId, dto);
  }

  @Post('subscription/bml')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initiate BML payment for subscription renewal' })
  @ApiResponse({ status: 201, description: 'BML subscription payment initiated' })
  @ApiResponse({ status: 400, description: 'Payment already exists or bad request' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @ApiResponse({ status: 403, description: 'Access denied to this subscription' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async initiateSubscriptionBmlPayment(
    @GetUser('id') userId: string,
    @Body() dto: InitiateSubscriptionBmlPaymentDto,
  ) {
    return await this.paymentsService.initiateSubscriptionBmlPayment(userId, dto);
  }

  // ============================================
  // Checkout-based Payment Endpoints (New Flow)
  // ============================================

  @Post('checkout/bank-transfer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit bank transfer payment for checkout session',
    description: 'Completes the checkout (creates booking/subscription) and records the payment',
  })
  @ApiResponse({ status: 201, description: 'Payment processed and booking/subscription created' })
  @ApiResponse({ status: 400, description: 'Checkout expired or already completed' })
  @ApiResponse({ status: 404, description: 'Checkout session not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async processCheckoutBankTransfer(
    @GetUser('id') userId: string,
    @Body() dto: CheckoutBankTransferPaymentDto,
  ) {
    return await this.paymentsService.processCheckoutBankTransfer(userId, dto);
  }

  @Post('checkout/bml')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Initiate BML payment for checkout session',
    description: 'Creates a pending payment and returns BML redirect URL. Booking is created on payment confirmation.',
  })
  @ApiResponse({
    status: 201,
    description: 'BML payment initiated',
    schema: {
      properties: {
        paymentId: { type: 'string' },
        redirectUrl: { type: 'string' },
        transactionId: { type: 'string' },
        expiresAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Checkout expired or already completed' })
  @ApiResponse({ status: 404, description: 'Checkout session not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async initiateCheckoutBmlPayment(
    @GetUser('id') userId: string,
    @Body() dto: CheckoutBmlPaymentDto,
  ) {
    return await this.paymentsService.initiateCheckoutBmlPayment(userId, dto);
  }
}
