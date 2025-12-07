import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TimeSlotsService } from './time-slots.service';
import { AvailableSlotsQueryDto } from './dto/available-slots-query.dto';
import { SubscriptionAvailabilityQueryDto } from './dto/subscription-availability-query.dto';
import { Public } from '../../common/decorators/public.decorator';

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
}
