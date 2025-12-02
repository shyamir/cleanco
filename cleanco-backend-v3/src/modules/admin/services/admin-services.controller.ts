import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminServicesService } from './admin-services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreatePricingRuleDto } from './dto/create-pricing-rule.dto';
import { UpdatePricingRuleDto } from './dto/update-pricing-rule.dto';
import { QueryPricingRulesDto } from './dto/query-pricing-rules.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Admin - Services')
@Controller('admin/services')
@Roles(UserRole.ADMIN)
export class AdminServicesController {
  constructor(private readonly adminServicesService: AdminServicesService) {}

  // ===== SERVICE MANAGEMENT =====

  @Post()
  @ApiOperation({ summary: 'Create a new service (Admin only)' })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  createService(@Body() createServiceDto: CreateServiceDto) {
    return this.adminServicesService.createService(createServiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all services including inactive (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all services' })
  findAllServices() {
    return this.adminServicesService.findAllServices();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Service details' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  findOneService(@Param('id') id: string) {
    return this.adminServicesService.findOneService(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a service (Admin only)' })
  @ApiResponse({ status: 200, description: 'Service updated successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  updateService(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto) {
    return this.adminServicesService.updateService(id, updateServiceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a service (Admin only)' })
  @ApiResponse({ status: 200, description: 'Service deleted successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  removeService(@Param('id') id: string) {
    return this.adminServicesService.removeService(id);
  }

  // ===== PRICING RULES MANAGEMENT =====

  @Post('pricing')
  @ApiOperation({ summary: 'Create a new pricing rule (Admin only)' })
  @ApiResponse({ status: 201, description: 'Pricing rule created successfully' })
  @ApiResponse({ status: 409, description: 'Pricing rule already exists' })
  createPricingRule(@Body() createPricingRuleDto: CreatePricingRuleDto) {
    return this.adminServicesService.createPricingRule(createPricingRuleDto);
  }

  @Get('pricing/list')
  @ApiOperation({ summary: 'Get all pricing rules (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of pricing rules' })
  findAllPricingRules(@Query() query: QueryPricingRulesDto) {
    return this.adminServicesService.findAllPricingRules(query);
  }

  @Get('pricing/:id')
  @ApiOperation({ summary: 'Get pricing rule by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Pricing rule details' })
  @ApiResponse({ status: 404, description: 'Pricing rule not found' })
  findOnePricingRule(@Param('id') id: string) {
    return this.adminServicesService.findOnePricingRule(id);
  }

  @Put('pricing/:id')
  @ApiOperation({ summary: 'Update a pricing rule (Admin only)' })
  @ApiResponse({ status: 200, description: 'Pricing rule updated successfully' })
  @ApiResponse({ status: 404, description: 'Pricing rule not found' })
  updatePricingRule(
    @Param('id') id: string,
    @Body() updatePricingRuleDto: UpdatePricingRuleDto,
  ) {
    return this.adminServicesService.updatePricingRule(id, updatePricingRuleDto);
  }

  @Delete('pricing/:id')
  @ApiOperation({ summary: 'Delete a pricing rule (Admin only)' })
  @ApiResponse({ status: 200, description: 'Pricing rule deleted successfully' })
  @ApiResponse({ status: 404, description: 'Pricing rule not found' })
  removePricingRule(@Param('id') id: string) {
    return this.adminServicesService.removePricingRule(id);
  }
}
