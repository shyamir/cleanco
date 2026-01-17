import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminBookingsService } from './admin-bookings.service';
import { AdminBookingsQueryDto } from './dto/admin-bookings-query.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { ConfirmInspectionDto } from './dto/confirm-inspection.dto';
import { AdminCreateBookingDto } from './dto/admin-create-booking.dto';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { RescheduleBookingDto } from '../../bookings/dto/reschedule-booking.dto';
import { CreateAddressDto } from '../../addresses/dto/create-address.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('Admin - Bookings')
@Controller('admin/bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminBookingsController {
  constructor(private readonly adminBookingsService: AdminBookingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all bookings with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'List of bookings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  findAll(@Query() query: AdminBookingsQueryDto) {
    return this.adminBookingsService.findAll(query);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get booking statistics' })
  @ApiResponse({ status: 200, description: 'Booking statistics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  getStatistics() {
    return this.adminBookingsService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiResponse({ status: 200, description: 'Booking details' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  findOne(@Param('id') id: string) {
    return this.adminBookingsService.findOne(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update booking status' })
  @ApiResponse({ status: 200, description: 'Booking status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateBookingStatusDto,
  ) {
    return this.adminBookingsService.updateStatus(id, updateStatusDto);
  }

  @Put(':id/reschedule')
  @ApiOperation({ summary: 'Admin reschedule booking (no 24h restriction)' })
  @ApiResponse({ status: 200, description: 'Booking rescheduled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot reschedule or slot unavailable' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  reschedule(
    @Param('id') id: string,
    @Body() rescheduleDto: RescheduleBookingDto,
  ) {
    return this.adminBookingsService.rescheduleBooking(id, rescheduleDto);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Admin cancel booking (releases slot capacity)' })
  @ApiResponse({ status: 200, description: 'Booking cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Booking already cancelled or completed' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  cancel(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.adminBookingsService.cancelBooking(id, body?.reason);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a booking' })
  @ApiResponse({ status: 200, description: 'Booking deleted successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  remove(@Param('id') id: string) {
    return this.adminBookingsService.remove(id);
  }

  // ===== INSPECTION ENDPOINTS =====

  @Get('pending-inspection/list')
  @ApiOperation({ summary: 'Get all bookings pending inspection (office bookings)' })
  @ApiResponse({ status: 200, description: 'List of bookings pending inspection' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  findPendingInspection() {
    return this.adminBookingsService.findPendingInspection();
  }

  @Put(':id/confirm-inspection')
  @ApiOperation({ summary: 'Confirm price after inspection' })
  @ApiResponse({ status: 200, description: 'Inspection confirmed and price updated' })
  @ApiResponse({ status: 400, description: 'Booking is not pending inspection' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  confirmInspection(
    @Param('id') id: string,
    @Body() confirmDto: ConfirmInspectionDto,
    @CurrentUser() user: any,
  ) {
    return this.adminBookingsService.confirmInspection(id, user.id, confirmDto);
  }

  // ===== ADMIN CREATE BOOKING ENDPOINTS =====

  @Post()
  @ApiOperation({
    summary: 'Admin create booking for a user',
    description: 'Create a one-time or subscription booking for any user. Admin can also create new users inline.',
  })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid booking data' })
  @ApiResponse({ status: 404, description: 'User or address not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  createBooking(@Body() dto: AdminCreateBookingDto) {
    return this.adminBookingsService.createBooking(dto);
  }

  @Post('users')
  @ApiOperation({
    summary: 'Admin create new customer',
    description: 'Create a new customer account that can then be used for bookings.',
  })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Phone number already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  createUser(@Body() dto: AdminCreateUserDto) {
    return this.adminBookingsService.createUser(dto);
  }

  @Get('users/:userId/addresses')
  @ApiOperation({
    summary: 'Get addresses for a specific user',
    description: 'Admin can view any user\'s saved addresses.',
  })
  @ApiResponse({ status: 200, description: 'List of user addresses' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  getUserAddresses(@Param('userId') userId: string) {
    return this.adminBookingsService.getUserAddresses(userId);
  }

  @Post('users/:userId/addresses')
  @ApiOperation({
    summary: 'Create address for a user',
    description: 'Admin can add a new address for any user.',
  })
  @ApiResponse({ status: 201, description: 'Address created successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  createUserAddress(
    @Param('userId') userId: string,
    @Body() dto: CreateAddressDto,
  ) {
    return this.adminBookingsService.createAddressForUser(userId, dto);
  }
}
