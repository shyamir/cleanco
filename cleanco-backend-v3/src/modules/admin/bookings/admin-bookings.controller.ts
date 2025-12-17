import {
  Controller,
  Get,
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
}
