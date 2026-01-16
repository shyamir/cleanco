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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminPromoCodesService } from './admin-promo-codes.service';
import { CreatePromoCodeDto, UpdatePromoCodeDto } from './dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Admin Promo Codes')
@ApiBearerAuth()
@Controller('admin/promo-codes')
@Roles(UserRole.ADMIN)
export class AdminPromoCodesController {
  constructor(private readonly adminPromoCodesService: AdminPromoCodesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all promo codes' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of promo codes' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.adminPromoCodesService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get promo code by ID' })
  @ApiResponse({ status: 200, description: 'Promo code details' })
  @ApiResponse({ status: 404, description: 'Promo code not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminPromoCodesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new promo code' })
  @ApiResponse({ status: 201, description: 'Promo code created successfully' })
  @ApiResponse({ status: 409, description: 'Promo code already exists' })
  async create(
    @Body() createDto: CreatePromoCodeDto,
    @CurrentUser() currentUser: any,
  ) {
    const adminId = currentUser.adminId || currentUser.id;
    return this.adminPromoCodesService.create(createDto, adminId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a promo code' })
  @ApiResponse({ status: 200, description: 'Promo code updated successfully' })
  @ApiResponse({ status: 404, description: 'Promo code not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdatePromoCodeDto,
  ) {
    return this.adminPromoCodesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a promo code' })
  @ApiResponse({ status: 200, description: 'Promo code deleted successfully' })
  @ApiResponse({ status: 404, description: 'Promo code not found' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.adminPromoCodesService.delete(id);
    return { message: 'Promo code deleted successfully' };
  }

  @Put(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle promo code active status' })
  @ApiResponse({ status: 200, description: 'Status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Promo code not found' })
  async toggleActive(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminPromoCodesService.toggleActive(id);
  }
}
