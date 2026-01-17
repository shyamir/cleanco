import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TimeSlotsService } from './time-slots.service';
import { AvailableSlotsQueryDto } from './dto/available-slots-query.dto';
import { SubscriptionAvailabilityQueryDto } from './dto/subscription-availability-query.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Time Slots')
@Controller('time-slots')
export class TimeSlotsController {
  constructor(private readonly timeSlotsService: TimeSlotsService) {}

  @Get('available')
  @Public()
  @ApiOperation({ summary: 'Get available time slots for a specific date' })
  @ApiResponse({ status: 200, description: 'Available time slots retrieved' })
  @ApiResponse({ status: 400, description: 'Invalid date or date in the past' })
  getAvailableSlots(@Query() query: AvailableSlotsQueryDto) {
    return this.timeSlotsService.getAvailableSlots(query);
  }

  @Get('subscription-availability')
  @Public()
  @ApiOperation({
    summary: 'Get available time slots for subscription across 12 weeks',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription availability retrieved',
  })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  getSubscriptionAvailability(@Query() query: SubscriptionAvailabilityQueryDto) {
    return this.timeSlotsService.getSubscriptionAvailability(query);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all time slots' })
  @ApiResponse({ status: 200, description: 'List of all time slots' })
  findAll() {
    return this.timeSlotsService.findAll();
  }

  // ===== ADMIN ENDPOINTS =====

  @Get('admin/available')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get available time slots for admin (no 6-hour restriction)',
    description: 'Admin can book slots that have not yet started. Past slots are hidden.',
  })
  @ApiResponse({ status: 200, description: 'Available time slots retrieved' })
  @ApiResponse({ status: 400, description: 'Invalid date or date in the past' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  getAdminAvailableSlots(@Query() query: AvailableSlotsQueryDto) {
    return this.timeSlotsService.getAvailableSlotsForAdmin(query);
  }

  @Get('admin/subscription-availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get subscription availability for admin (no 6-hour restriction)',
    description: 'Admin can book subscriptions without the 6-hour minimum notice.',
  })
  @ApiResponse({ status: 200, description: 'Subscription availability retrieved' })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  getAdminSubscriptionAvailability(@Query() query: SubscriptionAvailabilityQueryDto) {
    return this.timeSlotsService.getSubscriptionAvailabilityForAdmin(query);
  }
}
