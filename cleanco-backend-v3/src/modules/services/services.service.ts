import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CalculateQuoteDto } from './dto/calculate-quote.dto';
import { ServiceType } from '@prisma/client';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all active services
   */
  async findAll() {
    return this.prisma.service.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get a service by ID
   */
  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  /**
   * Calculate price quote based on service parameters
   */
  async calculateQuote(quoteDto: CalculateQuoteDto) {
    const { serviceType, frequency, bedrooms, officeSize, floors, rooms, promoCode } = quoteDto;

    // Validate service-specific parameters
    if (serviceType === ServiceType.HOME && !bedrooms) {
      throw new BadRequestException('Bedrooms are required for HOME service');
    }

    if (serviceType === ServiceType.OFFICE && !officeSize) {
      throw new BadRequestException('Office size is required for OFFICE service');
    }

    // Find matching pricing rule
    const pricingRule = await this.findBestMatchingPricingRule({
      serviceType,
      frequency: frequency || null,
      bedrooms: bedrooms || null,
      officeSize: officeSize || null,
      floors: floors || null,
      rooms: rooms || null,
    });

    if (!pricingRule) {
      throw new NotFoundException(
        'No pricing rule found for the specified parameters. Please contact support.',
      );
    }

    let basePrice = Number(pricingRule.price);
    let discount = 0;
    let promoCodeDetails = null;

    // Apply promo code if provided
    if (promoCode) {
      const promo = await this.prisma.promotionalCode.findUnique({
        where: { code: promoCode },
      });

      if (promo && promo.isActive && promo.startDate <= new Date() && promo.endDate >= new Date()) {
        if (promo.totalUsageLimit && promo.currentUsage >= promo.totalUsageLimit) {
          throw new BadRequestException('Promo code has reached its maximum usage limit');
        }

        // Check if service type is applicable
        if (promo.applicableServices.length > 0 && !promo.applicableServices.includes(serviceType)) {
          throw new BadRequestException('Promo code is not applicable for this service type');
        }

        // Check minimum purchase amount
        if (promo.minPurchaseAmount && basePrice < Number(promo.minPurchaseAmount)) {
          throw new BadRequestException(
            `Minimum purchase amount of ${promo.minPurchaseAmount} MVR required for this promo code`,
          );
        }

        if (promo.discountType === 'PERCENTAGE') {
          discount = basePrice * (Number(promo.discountValue) / 100);
        } else {
          discount = Number(promo.discountValue);
        }

        promoCodeDetails = {
          code: promo.code,
          discountType: promo.discountType,
          discountValue: Number(promo.discountValue),
        };
      } else if (!promo) {
        throw new BadRequestException('Invalid promo code');
      } else {
        throw new BadRequestException('Promo code is expired or inactive');
      }
    }

    const finalPrice = Math.max(0, basePrice - discount);

    return {
      serviceType,
      frequency: frequency || 'ONE_TIME',
      parameters: {
        bedrooms,
        officeSize,
        floors,
        rooms,
      },
      pricing: {
        basePrice,
        discount,
        finalPrice,
        currency: 'MVR',
      },
      promoCode: promoCodeDetails,
      pricingRuleId: pricingRule.id,
    };
  }

  /**
   * Get all pricing rules for a specific service type
   * Used for client-side price calculation
   */
  async getPricingRules(serviceType: ServiceType) {
    const rules = await this.prisma.pricingRule.findMany({
      where: {
        serviceType,
        isActive: true,
      },
      select: {
        id: true,
        serviceType: true,
        frequency: true,
        bedrooms: true,
        officeSize: true,
        floors: true,
        rooms: true,
        price: true,
      },
      orderBy: [
        { bedrooms: 'asc' },
        { frequency: 'asc' },
      ],
    });

    // Convert Decimal to number for JSON serialization
    return rules.map(rule => ({
      ...rule,
      price: Number(rule.price),
    }));
  }

  /**
   * Get minimum prices for each service type
   * Returns the lowest price for HOME and OFFICE services
   */
  async getMinimumPrices() {
    // Get minimum price for HOME service
    const homeMinPrice = await this.prisma.pricingRule.findFirst({
      where: {
        serviceType: ServiceType.HOME,
        isActive: true,
      },
      orderBy: { price: 'asc' },
    });

    // Get minimum price for OFFICE service
    const officeMinPrice = await this.prisma.pricingRule.findFirst({
      where: {
        serviceType: ServiceType.OFFICE,
        isActive: true,
      },
      orderBy: { price: 'asc' },
    });

    return {
      home: {
        minPrice: homeMinPrice ? Number(homeMinPrice.price) : null,
        currency: 'MVR',
      },
      office: {
        minPrice: officeMinPrice ? Number(officeMinPrice.price) : null,
        currency: 'MVR',
      },
    };
  }

  /**
   * Find the best matching pricing rule
   * Matches based on all non-null parameters
   */
  private async findBestMatchingPricingRule(params: {
    serviceType: ServiceType;
    frequency: string | null;
    bedrooms: number | null;
    officeSize: string | null;
    floors: number | null;
    rooms: number | null;
  }) {
    const where: any = {
      serviceType: params.serviceType,
      isActive: true,
    };

    // Add frequency condition (null for one-time, specific value for subscriptions)
    if (params.frequency === null) {
      where.frequency = null;
    } else {
      where.frequency = params.frequency;
    }

    // Add other parameters if provided
    if (params.bedrooms !== null) {
      where.bedrooms = params.bedrooms;
    }

    if (params.officeSize !== null) {
      where.officeSize = params.officeSize;
    }

    if (params.floors !== null) {
      where.floors = params.floors;
    }

    if (params.rooms !== null) {
      where.rooms = params.rooms;
    }

    // Try to find exact match first
    let pricingRule = await this.prisma.pricingRule.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // If no exact match, try to find a rule with only required parameters
    if (!pricingRule) {
      const minimalWhere: any = {
        serviceType: params.serviceType,
        isActive: true,
      };

      if (params.frequency === null) {
        minimalWhere.frequency = null;
      } else {
        minimalWhere.frequency = params.frequency;
      }

      // For HOME service, only bedrooms is required
      if (params.serviceType === ServiceType.HOME && params.bedrooms !== null) {
        minimalWhere.bedrooms = params.bedrooms;
      }

      // For OFFICE service, only officeSize is required
      if (params.serviceType === ServiceType.OFFICE && params.officeSize !== null) {
        minimalWhere.officeSize = params.officeSize;
        minimalWhere.floors = null;
        minimalWhere.rooms = null;
      }

      pricingRule = await this.prisma.pricingRule.findFirst({
        where: minimalWhere,
        orderBy: { createdAt: 'desc' },
      });
    }

    return pricingRule;
  }
}
