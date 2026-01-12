import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateOfficePricingTierDto } from './dto/create-office-pricing-tier.dto';
import { UpdateOfficePricingTierDto } from './dto/update-office-pricing-tier.dto';
import { CreateOfficeAddOnPricingDto } from './dto/create-office-addon-pricing.dto';
import { UpdateOfficeAddOnPricingDto } from './dto/update-office-addon-pricing.dto';
import { CreateHomePricingRuleDto } from './dto/create-home-pricing-rule.dto';
import { UpdateHomePricingRuleDto } from './dto/update-home-pricing-rule.dto';

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

  // ==================== Home Pricing Rules ====================

  /**
   * Create a new home pricing rule
   */
  async createHomePricingRule(createDto: CreateHomePricingRuleDto) {
    // Check for duplicate (unique constraint on [frequency, bedrooms])
    const existing = await this.prisma.homePricingRule.findFirst({
      where: {
        frequency: createDto.frequency || null,
        bedrooms: createDto.bedrooms,
      },
    });

    if (existing) {
      throw new ConflictException('A home pricing rule with these parameters already exists');
    }

    return this.prisma.homePricingRule.create({
      data: {
        frequency: createDto.frequency || null,
        bedrooms: createDto.bedrooms,
        price: createDto.price,
        isActive: createDto.isActive ?? true,
      },
    });
  }

  /**
   * Get all home pricing rules
   */
  async findAllHomePricingRules() {
    return this.prisma.homePricingRule.findMany({
      orderBy: [{ frequency: 'asc' }, { bedrooms: 'asc' }],
    });
  }

  /**
   * Get a home pricing rule by ID
   */
  async findOneHomePricingRule(id: string) {
    const rule = await this.prisma.homePricingRule.findUnique({
      where: { id },
    });

    if (!rule) {
      throw new NotFoundException('Home pricing rule not found');
    }

    return rule;
  }

  /**
   * Update a home pricing rule
   */
  async updateHomePricingRule(id: string, updateDto: UpdateHomePricingRuleDto) {
    await this.findOneHomePricingRule(id);

    return this.prisma.homePricingRule.update({
      where: { id },
      data: updateDto,
    });
  }

  /**
   * Delete a home pricing rule
   */
  async removeHomePricingRule(id: string) {
    await this.findOneHomePricingRule(id);

    await this.prisma.homePricingRule.delete({
      where: { id },
    });

    return { message: 'Home pricing rule deleted successfully' };
  }
}
