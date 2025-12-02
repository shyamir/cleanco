import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreatePricingRuleDto } from './dto/create-pricing-rule.dto';
import { UpdatePricingRuleDto } from './dto/update-pricing-rule.dto';
import { QueryPricingRulesDto } from './dto/query-pricing-rules.dto';
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
        bathrooms: createDto.bathrooms || null,
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
        bathrooms: createDto.bathrooms || null,
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
        bathrooms: updateDto.bathrooms !== undefined ? updateDto.bathrooms : undefined,
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
}
