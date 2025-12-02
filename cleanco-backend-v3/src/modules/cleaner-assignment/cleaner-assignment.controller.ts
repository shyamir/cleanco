import {
  Controller,
  Post,
  Get,
  Delete,
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
import { CleanerAssignmentService } from './cleaner-assignment.service';
import { AssignCleanersDto } from './dto/assign-cleaners.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin - Cleaner Assignment')
@Controller('admin/cleaner-assignment')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class CleanerAssignmentController {
  constructor(
    private readonly cleanerAssignmentService: CleanerAssignmentService,
  ) {}

  @Post(':bookingId/auto-assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Auto-assign cleaners to a booking' })
  @ApiResponse({ status: 200, description: 'Cleaners auto-assigned successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async autoAssign(@Param('bookingId') bookingId: string) {
    await this.cleanerAssignmentService.autoAssignCleaners(bookingId);
    return {
      message: 'Cleaners auto-assigned successfully',
    };
  }

  @Post(':bookingId/manual-assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually assign cleaners to a booking' })
  @ApiResponse({ status: 200, description: 'Cleaners assigned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid cleaner IDs' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async manualAssign(
    @Param('bookingId') bookingId: string,
    @Body() assignCleanersDto: AssignCleanersDto,
  ) {
    await this.cleanerAssignmentService.manuallyAssignCleaners(
      bookingId,
      assignCleanersDto.cleanerIds,
    );
    return {
      message: 'Cleaners assigned successfully',
    };
  }

  @Get(':bookingId/assignments')
  @ApiOperation({ summary: 'Get assigned cleaners for a booking' })
  @ApiResponse({ status: 200, description: 'List of assigned cleaners' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async getAssignments(@Param('bookingId') bookingId: string) {
    return await this.cleanerAssignmentService.getAssignedCleaners(bookingId);
  }

  @Delete('assignments/:assignmentId')
  @ApiOperation({ summary: 'Remove a cleaner assignment' })
  @ApiResponse({ status: 200, description: 'Assignment removed successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async removeAssignment(@Param('assignmentId') assignmentId: string) {
    await this.cleanerAssignmentService.removeCleanerAssignment(assignmentId);
    return {
      message: 'Assignment removed successfully',
    };
  }

  @Post(':bookingId/reassign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Re-assign cleaners after rescheduling' })
  @ApiResponse({ status: 200, description: 'Cleaners re-assigned successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async reassign(@Param('bookingId') bookingId: string) {
    await this.cleanerAssignmentService.reassignOnReschedule(bookingId);
    return {
      message: 'Cleaners re-assigned successfully',
    };
  }
}
