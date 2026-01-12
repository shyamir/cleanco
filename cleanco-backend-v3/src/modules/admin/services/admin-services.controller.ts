import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminServicesService } from './admin-services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateOfficePricingTierDto } from './dto/create-office-pricing-tier.dto';
import { UpdateOfficePricingTierDto } from './dto/update-office-pricing-tier.dto';
import { CreateOfficeAddOnPricingDto } from './dto/create-office-addon-pricing.dto';
import { UpdateOfficeAddOnPricingDto } from './dto/update-office-addon-pricing.dto';
import { CreateHomePricingRuleDto } from './dto/create-home-pricing-rule.dto';
import { UpdateHomePricingRuleDto } from './dto/update-home-pricing-rule.dto';
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

  // ===== OFFICE PRICING TIERS MANAGEMENT =====

  @Post('office-pricing')
  @ApiOperation({ summary: 'Create a new office pricing tier (Admin only)' })
  @ApiResponse({ status: 201, description: 'Office pricing tier created successfully' })
  @ApiResponse({ status: 409, description: 'Overlapping tier exists or invalid range' })
  createOfficePricingTier(@Body() createDto: CreateOfficePricingTierDto) {
    return this.adminServicesService.createOfficePricingTier(createDto);
  }

  @Get('office-pricing/list')
  @ApiOperation({ summary: 'Get all office pricing tiers (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of office pricing tiers' })
  findAllOfficePricingTiers() {
    return this.adminServicesService.findAllOfficePricingTiers();
  }

  @Get('office-pricing/:id')
  @ApiOperation({ summary: 'Get office pricing tier by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Office pricing tier details' })
  @ApiResponse({ status: 404, description: 'Office pricing tier not found' })
  findOneOfficePricingTier(@Param('id') id: string) {
    return this.adminServicesService.findOneOfficePricingTier(id);
  }

  @Put('office-pricing/:id')
  @ApiOperation({ summary: 'Update an office pricing tier (Admin only)' })
  @ApiResponse({ status: 200, description: 'Office pricing tier updated successfully' })
  @ApiResponse({ status: 404, description: 'Office pricing tier not found' })
  updateOfficePricingTier(
    @Param('id') id: string,
    @Body() updateDto: UpdateOfficePricingTierDto,
  ) {
    return this.adminServicesService.updateOfficePricingTier(id, updateDto);
  }

  @Delete('office-pricing/:id')
  @ApiOperation({ summary: 'Delete an office pricing tier (Admin only)' })
  @ApiResponse({ status: 200, description: 'Office pricing tier deleted successfully' })
  @ApiResponse({ status: 404, description: 'Office pricing tier not found' })
  removeOfficePricingTier(@Param('id') id: string) {
    return this.adminServicesService.removeOfficePricingTier(id);
  }

  // ===== OFFICE ADD-ON PRICING MANAGEMENT =====

  @Post('office-addons')
  @ApiOperation({ summary: 'Create a new office add-on pricing (Admin only)' })
  @ApiResponse({ status: 201, description: 'Office add-on pricing created successfully' })
  @ApiResponse({ status: 409, description: 'Add-on pricing already exists' })
  createOfficeAddOnPricing(@Body() createDto: CreateOfficeAddOnPricingDto) {
    return this.adminServicesService.createOfficeAddOnPricing(createDto);
  }

  @Get('office-addons/list')
  @ApiOperation({ summary: 'Get all office add-on pricing (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of office add-on pricing' })
  findAllOfficeAddOnPricing() {
    return this.adminServicesService.findAllOfficeAddOnPricing();
  }

  @Get('office-addons/:id')
  @ApiOperation({ summary: 'Get office add-on pricing by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Office add-on pricing details' })
  @ApiResponse({ status: 404, description: 'Office add-on pricing not found' })
  findOneOfficeAddOnPricing(@Param('id') id: string) {
    return this.adminServicesService.findOneOfficeAddOnPricing(id);
  }

  @Put('office-addons/:id')
  @ApiOperation({ summary: 'Update an office add-on pricing (Admin only)' })
  @ApiResponse({ status: 200, description: 'Office add-on pricing updated successfully' })
  @ApiResponse({ status: 404, description: 'Office add-on pricing not found' })
  updateOfficeAddOnPricing(
    @Param('id') id: string,
    @Body() updateDto: UpdateOfficeAddOnPricingDto,
  ) {
    return this.adminServicesService.updateOfficeAddOnPricing(id, updateDto);
  }

  @Delete('office-addons/:id')
  @ApiOperation({ summary: 'Delete an office add-on pricing (Admin only)' })
  @ApiResponse({ status: 200, description: 'Office add-on pricing deleted successfully' })
  @ApiResponse({ status: 404, description: 'Office add-on pricing not found' })
  removeOfficeAddOnPricing(@Param('id') id: string) {
    return this.adminServicesService.removeOfficeAddOnPricing(id);
  }

  // ===== HOME PRICING RULES MANAGEMENT =====

  @Post('home-pricing')
  @ApiOperation({ summary: 'Create a new home pricing rule (Admin only)' })
  @ApiResponse({ status: 201, description: 'Home pricing rule created successfully' })
  @ApiResponse({ status: 409, description: 'Home pricing rule already exists' })
  createHomePricingRule(@Body() createDto: CreateHomePricingRuleDto) {
    return this.adminServicesService.createHomePricingRule(createDto);
  }

  @Get('home-pricing/list')
  @ApiOperation({ summary: 'Get all home pricing rules (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of home pricing rules' })
  findAllHomePricingRules() {
    return this.adminServicesService.findAllHomePricingRules();
  }

  @Get('home-pricing/:id')
  @ApiOperation({ summary: 'Get home pricing rule by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Home pricing rule details' })
  @ApiResponse({ status: 404, description: 'Home pricing rule not found' })
  findOneHomePricingRule(@Param('id') id: string) {
    return this.adminServicesService.findOneHomePricingRule(id);
  }

  @Put('home-pricing/:id')
  @ApiOperation({ summary: 'Update a home pricing rule (Admin only)' })
  @ApiResponse({ status: 200, description: 'Home pricing rule updated successfully' })
  @ApiResponse({ status: 404, description: 'Home pricing rule not found' })
  updateHomePricingRule(
    @Param('id') id: string,
    @Body() updateDto: UpdateHomePricingRuleDto,
  ) {
    return this.adminServicesService.updateHomePricingRule(id, updateDto);
  }

  @Delete('home-pricing/:id')
  @ApiOperation({ summary: 'Delete a home pricing rule (Admin only)' })
  @ApiResponse({ status: 200, description: 'Home pricing rule deleted successfully' })
  @ApiResponse({ status: 404, description: 'Home pricing rule not found' })
  removeHomePricingRule(@Param('id') id: string) {
    return this.adminServicesService.removeHomePricingRule(id);
  }
}
