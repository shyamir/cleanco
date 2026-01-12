import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
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
import { CheckoutService } from './checkout.service';
import { CreateBookingDto } from '../bookings/dto/create-booking.dto';
import { CreateSubscriptionDto } from '../subscriptions/dto/create-subscription.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Checkout')
@Controller('checkout')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('booking')
  @ApiOperation({
    summary: 'Create checkout session for a booking',
    description:
      'Creates a checkout session and holds the slot for 5 minutes. Call payment endpoint with checkoutSessionId to complete.',
  })
  @ApiResponse({
    status: 201,
    description: 'Checkout session created successfully',
    schema: {
      properties: {
        checkoutSessionId: { type: 'string', example: 'uuid' },
        expiresAt: { type: 'string', format: 'date-time' },
        holdDurationSeconds: { type: 'number', example: 300 },
        price: {
          type: 'object',
          properties: {
            basePrice: { type: 'number' },
            discountAmount: { type: 'number' },
            finalPrice: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation failed or slot unavailable' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createBookingCheckout(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateBookingDto,
  ) {
    return this.checkoutService.createBookingCheckout(user.userId, dto);
  }

  @Post('subscription')
  @ApiOperation({
    summary: 'Create checkout session for a subscription',
    description:
      'Creates a checkout session and holds all slots for 12 weeks. Expires in 5 minutes if not completed.',
  })
  @ApiResponse({
    status: 201,
    description: 'Checkout session created successfully',
    schema: {
      properties: {
        checkoutSessionId: { type: 'string', example: 'uuid' },
        expiresAt: { type: 'string', format: 'date-time' },
        holdDurationSeconds: { type: 'number', example: 300 },
        price: {
          type: 'object',
          properties: {
            basePrice: { type: 'number' },
            discountAmount: { type: 'number' },
            finalPrice: { type: 'number' },
          },
        },
        slotsReserved: { type: 'number', example: 12 },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation failed or slots unavailable' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createSubscriptionCheckout(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.checkoutService.createSubscriptionCheckout(user.userId, dto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get checkout session status',
    description: 'Returns the checkout session with remaining hold time',
  })
  @ApiResponse({
    status: 200,
    description: 'Checkout session details',
    schema: {
      properties: {
        id: { type: 'string' },
        type: { type: 'string', enum: ['BOOKING', 'SUBSCRIPTION'] },
        status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'EXPIRED'] },
        expiresAt: { type: 'string', format: 'date-time' },
        remainingSeconds: { type: 'number', example: 245 },
        isExpired: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Checkout session not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCheckoutSession(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') sessionId: string,
  ) {
    return this.checkoutService.getCheckoutSession(sessionId, user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel checkout session',
    description: 'Cancels the checkout and releases all held slots',
  })
  @ApiResponse({ status: 200, description: 'Checkout cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel completed checkout' })
  @ApiResponse({ status: 404, description: 'Checkout session not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cancelCheckout(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') sessionId: string,
  ) {
    return this.checkoutService.cancelCheckout(sessionId, user.userId);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete checkout (internal)',
    description:
      'Creates the actual booking/subscription. Usually called by payment service after payment confirmation.',
  })
  @ApiResponse({ status: 200, description: 'Checkout completed, booking/subscription created' })
  @ApiResponse({ status: 400, description: 'Checkout expired or already completed' })
  @ApiResponse({ status: 404, description: 'Checkout session not found' })
  async completeCheckout(@Param('id') sessionId: string) {
    return this.checkoutService.completeCheckout(sessionId);
  }
}
