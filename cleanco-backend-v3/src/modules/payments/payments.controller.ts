import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreateBankTransferPaymentDto } from './dto/create-bank-transfer-payment.dto';
import { InitiateBmlPaymentDto } from './dto/initiate-bml-payment.dto';
import { CreateSubscriptionBankTransferPaymentDto } from './dto/create-subscription-bank-transfer-payment.dto';
import { InitiateSubscriptionBmlPaymentDto } from './dto/initiate-subscription-bml-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';

@ApiTags('Customer - Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CUSTOMER')
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('bank-transfer')
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
  @ApiOperation({ summary: 'Get all payments for the authenticated customer' })
  @ApiResponse({ status: 200, description: 'List of payments' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findMy(@GetUser('id') userId: string) {
    return await this.paymentsService.findUserPayments(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment details' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 403, description: 'Access denied to this payment' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return await this.paymentsService.findOne(id, userId);
  }

  @Post('subscription/bank-transfer')
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
}
