import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreatePricingRuleDto } from './dto/create-pricing-rule.dto';
import { UpdatePricingRuleDto } from './dto/update-pricing-rule.dto';
import { QueryPricingRulesDto } from './dto/query-pricing-rules.dto';
import { CreateOfficePricingTierDto } from './dto/create-office-pricing-tier.dto';
import { UpdateOfficePricingTierDto } from './dto/update-office-pricing-tier.dto';
import { CreateOfficeAddOnPricingDto } from './dto/create-office-addon-pricing.dto';
import { UpdateOfficeAddOnPricingDto } from './dto/update-office-addon-pricing.dto';
import { ServiceType } from '@prisma/client';

@Injectable()
export class AdminServicesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new service
   */
  async createService(createDto: CreateServiceDto) {
    return this.prisma.service.create({
      data: createDto,
    });
  }

  /**
   * Get all services (including inactive)
   */
  async findAllServices() {
    return this.prisma.service.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get a service by ID
   */
  async findOneService(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  /**
   * Update a service
   */
  async updateService(id: string, updateDto: UpdateServiceDto) {
    await this.findOneService(id); // Check if exists

    return this.prisma.service.update({
      where: { id },
      data: updateDto,
    });
  }

  /**
   * Delete a service
   */
  async removeService(id: string) {
    await this.findOneService(id); // Check if exists

    await this.prisma.service.delete({
      where: { id },
    });

    return { message: 'Service deleted successfully' };
  }

  /**
   * Create a new pricing rule
   */
  async createPricingRule(createDto: CreatePricingRuleDto) {
    // Check for duplicate pricing rule
    const existing = await this.prisma.pricingRule.findFirst({
      where: {
        serviceType: createDto.serviceType,
        frequency: createDto.frequency || null,
        bedrooms: createDto.bedrooms || null,
        officeSize: createDto.officeSize || null,
        floors: createDto.floors || null,
        rooms: createDto.rooms || null,
      },
    });

    if (existing) {
      throw new ConflictException('A pricing rule with these parameters already exists');
    }

    return this.prisma.pricingRule.create({
      data: {
        ...createDto,
        bedrooms: createDto.bedrooms || null,
        officeSize: createDto.officeSize || null,
        floors: createDto.floors || null,
        rooms: createDto.rooms || null,
      },
    });
  }

  /**
   * Get all pricing rules with optional filtering
   */
  async findAllPricingRules(query: QueryPricingRulesDto) {
    const where: any = {};

    if (query.serviceType) {
      where.serviceType = query.serviceType;
    }

    return this.prisma.pricingRule.findMany({
      where,
      orderBy: [
        { serviceType: 'asc' },
        { frequency: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Get a pricing rule by ID
   */
  async findOnePricingRule(id: string) {
    const pricingRule = await this.prisma.pricingRule.findUnique({
      where: { id },
    });

    if (!pricingRule) {
      throw new NotFoundException('Pricing rule not found');
    }

    return pricingRule;
  }

  /**
   * Update a pricing rule
   */
  async updatePricingRule(id: string, updateDto: UpdatePricingRuleDto) {
    await this.findOnePricingRule(id); // Check if exists

    return this.prisma.pricingRule.update({
      where: { id },
      data: {
        ...updateDto,
        bedrooms: updateDto.bedrooms !== undefined ? updateDto.bedrooms : undefined,
        officeSize: updateDto.officeSize !== undefined ? updateDto.officeSize : undefined,
        floors: updateDto.floors !== undefined ? updateDto.floors : undefined,
        rooms: updateDto.rooms !== undefined ? updateDto.rooms : undefined,
      },
    });
  }

  /**
   * Delete a pricing rule
   */
  async removePricingRule(id: string) {
    await this.findOnePricingRule(id); // Check if exists

    await this.prisma.pricingRule.delete({
      where: { id },
    });

    return { message: 'Pricing rule deleted successfully' };
  }

  // ==================== Office Pricing Tiers ====================

  /**
   * Create a new office pricing tier
   */
  async createOfficePricingTier(createDto: CreateOfficePricingTierDto) {
    // Validate sqftMax >= sqftMin
    if (createDto.sqftMax < createDto.sqftMin) {
      throw new ConflictException('sqftMax must be greater than or equal to sqftMin');
    }

    // Check for overlapping tiers
    const overlapping = await this.prisma.officePricingTier.findFirst({
      where: {
        frequency: createDto.frequency || null,
        isActive: true,
        OR: [
          {
            sqftMin: { lte: createDto.sqftMax },
            sqftMax: { gte: createDto.sqftMin },
          },
        ],
      },
    });

    if (overlapping) {
      throw new ConflictException('An overlapping pricing tier already exists for this frequency');
    }

    return this.prisma.officePricingTier.create({
      data: {
        ...createDto,
        frequency: createDto.frequency || null,
      },
    });
  }

  /**
   * Get all office pricing tiers
   */
  async findAllOfficePricingTiers() {
    return this.prisma.officePricingTier.findMany({
      orderBy: [{ frequency: 'asc' }, { sqftMin: 'asc' }],
    });
  }

  /**
   * Get an office pricing tier by ID
   */
  async findOneOfficePricingTier(id: string) {
    const tier = await this.prisma.officePricingTier.findUnique({
      where: { id },
    });

    if (!tier) {
      throw new NotFoundException('Office pricing tier not found');
    }

    return tier;
  }

  /**
   * Update an office pricing tier
   */
  async updateOfficePricingTier(id: string, updateDto: UpdateOfficePricingTierDto) {
    await this.findOneOfficePricingTier(id);

    return this.prisma.officePricingTier.update({
      where: { id },
      data: updateDto,
    });
  }

  /**
   * Delete an office pricing tier
   */
  async removeOfficePricingTier(id: string) {
    await this.findOneOfficePricingTier(id);

    await this.prisma.officePricingTier.delete({
      where: { id },
    });

    return { message: 'Office pricing tier deleted successfully' };
  }

  // ==================== Office Add-On Pricing ====================

  /**
   * Create a new office add-on pricing
   */
  async createOfficeAddOnPricing(createDto: CreateOfficeAddOnPricingDto) {
    // Check for duplicate
    const existing = await this.prisma.officeAddOnPricing.findFirst({
      where: {
        addOnType: createDto.addOnType,
        minQuantity: createDto.minQuantity,
      },
    });

    if (existing) {
      throw new ConflictException('An add-on pricing with these parameters already exists');
    }

    return this.prisma.officeAddOnPricing.create({
      data: createDto,
    });
  }

  /**
   * Get all office add-on pricing
   */
  async findAllOfficeAddOnPricing() {
    return this.prisma.officeAddOnPricing.findMany({
      orderBy: [{ addOnType: 'asc' }, { minQuantity: 'asc' }],
    });
  }

  /**
   * Get an office add-on pricing by ID
   */
  async findOneOfficeAddOnPricing(id: string) {
    const addOn = await this.prisma.officeAddOnPricing.findUnique({
      where: { id },
    });

    if (!addOn) {
      throw new NotFoundException('Office add-on pricing not found');
    }

    return addOn;
  }

  /**
   * Update an office add-on pricing
   */
  async updateOfficeAddOnPricing(id: string, updateDto: UpdateOfficeAddOnPricingDto) {
    await this.findOneOfficeAddOnPricing(id);

    return this.prisma.officeAddOnPricing.update({
      where: { id },
      data: updateDto,
    });
  }

  /**
   * Delete an office add-on pricing
   */
  async removeOfficeAddOnPricing(id: string) {
    await this.findOneOfficeAddOnPricing(id);

    await this.prisma.officeAddOnPricing.delete({
      where: { id },
    });

    return { message: 'Office add-on pricing deleted successfully' };
  }
}
