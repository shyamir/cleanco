import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RescheduleBookingDto } from './dto/reschedule-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed or invalid parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@CurrentUser() user: CurrentUserPayload, @Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(user.userId, createBookingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bookings for current user' })
  @ApiResponse({ status: 200, description: 'List of user bookings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.bookingsService.findAll(user.userId);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get the next upcoming booking for current user' })
  @ApiResponse({ status: 200, description: 'Upcoming booking or null if none' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getUpcoming(@CurrentUser() user: CurrentUserPayload) {
    return this.bookingsService.getUpcoming(user.userId);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get all upcoming bookings for activity page' })
  @ApiResponse({ status: 200, description: 'List of upcoming bookings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getActivityBookings(@CurrentUser() user: CurrentUserPayload) {
    return this.bookingsService.getActivityBookings(user.userId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get past bookings for history page' })
  @ApiResponse({ status: 200, description: 'List of past bookings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getHistoryBookings(@CurrentUser() user: CurrentUserPayload) {
    return this.bookingsService.getHistoryBookings(user.userId);
  }

  @Get('quotes')
  @ApiOperation({ summary: 'Get pending inspection bookings (quotes)' })
  @ApiResponse({ status: 200, description: 'List of quotes awaiting price confirmation' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getQuotes(@CurrentUser() user: CurrentUserPayload) {
    return this.bookingsService.getQuotes(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking details by ID' })
  @ApiResponse({ status: 200, description: 'Booking details' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.bookingsService.findOne(user.userId, id);
  }

  @Put(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule a booking' })
  @ApiResponse({ status: 200, description: 'Booking rescheduled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot reschedule or invalid parameters' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  reschedule(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() rescheduleDto: RescheduleBookingDto,
  ) {
    return this.bookingsService.reschedule(user.userId, id, rescheduleDto);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiResponse({ status: 200, description: 'Booking canceled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel booking' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  cancel(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() cancelDto: CancelBookingDto,
  ) {
    return this.bookingsService.cancel(user.userId, id, cancelDto);
  }
}
