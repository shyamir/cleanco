import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminCleanersService } from './admin-cleaners.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Admin - Cleaners')
@Controller('admin/cleaners')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminCleanersController {
  constructor(private readonly adminCleanersService: AdminCleanersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all cleaner profiles (admin only)' })
  @ApiResponse({ status: 200, description: 'Cleaner profiles retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.adminCleanersService.findAll({ page, limit, search });
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available cleaners for a specific date/time slot' })
  @ApiResponse({ status: 200, description: 'Available cleaners retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async findAvailable(
    @Query('date') date: string,
    @Query('timeSlotId') timeSlotId: string,
    @Query('excludeBookingId') excludeBookingId?: string,
  ) {
    return this.adminCleanersService.findAvailable({
      date,
      timeSlotId,
      excludeBookingId,
    });
  }
}
