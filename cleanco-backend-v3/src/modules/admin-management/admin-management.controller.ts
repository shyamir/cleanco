import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminManagementService } from './admin-management.service';
import { CreateAdminDto, UpdateAdminDto, ResetPasswordDto } from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Admin Management')
@ApiBearerAuth()
@Controller('admin-management')
export class AdminManagementController {
  constructor(private readonly adminManagementService: AdminManagementService) {}

  @Get('admins')
  @ApiOperation({ summary: 'Get all admins (SUPER_ADMIN only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of admins' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN required' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @CurrentUser() currentUser?: any,
  ) {
    // Check for SUPER_ADMIN role
    this.requireSuperAdmin(currentUser);

    return this.adminManagementService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
    });
  }

  @Get('admins/:id')
  @ApiOperation({ summary: 'Get admin by ID (SUPER_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Admin details' })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN required' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser?: any,
  ) {
    this.requireSuperAdmin(currentUser);
    return this.adminManagementService.findById(id);
  }

  @Post('admins')
  @ApiOperation({ summary: 'Create a new admin (SUPER_ADMIN only)' })
  @ApiResponse({ status: 201, description: 'Admin created successfully' })
  @ApiResponse({ status: 409, description: 'Username already exists' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN required' })
  async create(
    @Body() createAdminDto: CreateAdminDto,
    @CurrentUser() currentUser?: any,
  ) {
    this.requireSuperAdmin(currentUser);
    return this.adminManagementService.create(createAdminDto, currentUser.adminId || currentUser.id);
  }

  @Put('admins/:id')
  @ApiOperation({ summary: 'Update an admin (SUPER_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Admin updated successfully' })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN required' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAdminDto: UpdateAdminDto,
    @CurrentUser() currentUser?: any,
  ) {
    this.requireSuperAdmin(currentUser);
    return this.adminManagementService.update(id, updateAdminDto, currentUser.adminId || currentUser.id);
  }

  @Put('admins/:id/reset-password')
  @ApiOperation({ summary: 'Reset admin password (SUPER_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN required' })
  async resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() resetPasswordDto: ResetPasswordDto,
    @CurrentUser() currentUser?: any,
  ) {
    this.requireSuperAdmin(currentUser);
    await this.adminManagementService.resetPassword(id, resetPasswordDto, currentUser.adminId || currentUser.id);
    return { message: 'Password reset successfully' };
  }

  @Delete('admins/:id')
  @ApiOperation({ summary: 'Deactivate an admin (SUPER_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Admin deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN required' })
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser?: any,
  ) {
    this.requireSuperAdmin(currentUser);
    await this.adminManagementService.deactivate(id, currentUser.adminId || currentUser.id);
    return { message: 'Admin deactivated successfully' };
  }

  @Put('admins/:id/activate')
  @ApiOperation({ summary: 'Reactivate an admin (SUPER_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Admin reactivated successfully' })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN required' })
  async activate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser?: any,
  ) {
    this.requireSuperAdmin(currentUser);
    return this.adminManagementService.activate(id);
  }

  /**
   * Helper to check if current user is a SUPER_ADMIN
   */
  private requireSuperAdmin(user: any) {
    // Admin portal tokens have isAdminPortal: true and role set
    if (!user?.isAdminPortal) {
      throw new ForbiddenException('Admin portal access required');
    }

    // Check for SUPER_ADMIN role (could be 'SUPER_ADMIN' from AdminRole)
    if (user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Super admin privileges required');
    }
  }
}
