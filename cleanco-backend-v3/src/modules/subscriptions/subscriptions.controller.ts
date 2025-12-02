import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';

@ApiTags('Customer - Subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CUSTOMER')
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Address or time slot not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Customer only' })
  async create(
    @GetUser('id') userId: string,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    return await this.subscriptionsService.create(userId, createSubscriptionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subscriptions for the logged-in customer' })
  @ApiResponse({ status: 200, description: 'List of subscriptions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Customer only' })
  async findMy(@GetUser('id') userId: string) {
    return await this.subscriptionsService.findUserSubscriptions(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific subscription by ID' })
  @ApiResponse({ status: 200, description: 'Subscription details' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @ApiResponse({ status: 403, description: 'Access denied to this subscription' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return await this.subscriptionsService.findOne(id, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update subscription details' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Subscription or time slot not found' })
  @ApiResponse({ status: 403, description: 'Access denied to this subscription' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return await this.subscriptionsService.update(id, userId, updateSubscriptionDto);
  }

  @Patch(':id/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause a subscription' })
  @ApiResponse({ status: 200, description: 'Subscription paused successfully' })
  @ApiResponse({ status: 400, description: 'Only active subscriptions can be paused' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @ApiResponse({ status: 403, description: 'Access denied to this subscription' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async pause(@Param('id') id: string, @GetUser('id') userId: string) {
    const subscription = await this.subscriptionsService.pause(id, userId);
    return {
      message: 'Subscription paused successfully',
      subscription,
    };
  }

  @Patch(':id/resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resume a paused subscription' })
  @ApiResponse({ status: 200, description: 'Subscription resumed successfully' })
  @ApiResponse({ status: 400, description: 'Only paused subscriptions can be resumed' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @ApiResponse({ status: 403, description: 'Access denied to this subscription' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async resume(@Param('id') id: string, @GetUser('id') userId: string) {
    const subscription = await this.subscriptionsService.resume(id, userId);
    return {
      message: 'Subscription resumed successfully',
      subscription,
    };
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a subscription' })
  @ApiResponse({ status: 200, description: 'Subscription canceled successfully' })
  @ApiResponse({ status: 400, description: 'Subscription is already canceled' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @ApiResponse({ status: 403, description: 'Access denied to this subscription' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cancel(@Param('id') id: string, @GetUser('id') userId: string) {
    const subscription = await this.subscriptionsService.cancel(id, userId);
    return {
      message: 'Subscription canceled successfully',
      subscription,
    };
  }
}
