import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CalculateQuoteDto } from './dto/calculate-quote.dto';
import { ServiceType, SubscriptionFrequency } from '@prisma/client';
import { DateUtils } from '../../common/utils/date.utils';

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
    const { serviceType, frequency, bedrooms, squareFeet, floors, rooms, toilets, promoCode } = quoteDto;

    // Validate service-specific parameters
    if (serviceType === ServiceType.HOME && !bedrooms) {
      throw new BadRequestException('Bedrooms are required for HOME service');
    }

    if (serviceType === ServiceType.OFFICE) {
      if (!squareFeet) {
        throw new BadRequestException('Square feet is required for OFFICE service');
      }
      if (!rooms) {
        throw new BadRequestException('Number of rooms is required for OFFICE service');
      }
      if (!toilets) {
        throw new BadRequestException('Number of toilets is required for OFFICE service');
      }
    }

    let basePrice: number;
    let pricingDetails: any = {};
    let isEstimate = false;

    if (serviceType === ServiceType.OFFICE) {
      // Use new sqft-based office pricing
      const officeQuote = await this.calculateOfficeQuote({
        squareFeet: squareFeet!, // Validated above
        rooms: rooms!, // Validated above
        toilets: toilets!, // Validated above
        frequency: frequency || null,
      });
      basePrice = officeQuote.totalPrice;
      pricingDetails = officeQuote;
      isEstimate = true; // Office quotes are estimates pending inspection
    } else {
      // Use standard pricing rule for HOME service
      const pricingRule = await this.findBestMatchingPricingRule({
        serviceType,
        frequency: frequency || null,
        bedrooms: bedrooms || null,
        officeSize: null,
        floors: floors || null,
        rooms: rooms || null,
      });

      if (!pricingRule) {
        throw new NotFoundException(
          'No pricing rule found for the specified parameters. Please contact support.',
        );
      }

      basePrice = Number(pricingRule.price);
      pricingDetails.pricingRuleId = pricingRule.id;
    }

    let discount = 0;
    let promoCodeDetails = null;

    // Apply promo code if provided
    if (promoCode) {
      const promo = await this.prisma.promotionalCode.findUnique({
        where: { code: promoCode },
      });

      const now = DateUtils.nowInMaldives();
      if (promo && promo.isActive && promo.startDate <= now && promo.endDate >= now) {
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
      isEstimate, // True for office bookings (pending inspection)
      parameters: {
        bedrooms,
        squareFeet,
        floors,
        rooms,
        toilets,
      },
      pricing: {
        basePrice,
        ...pricingDetails,
        discount,
        finalPrice,
        currency: 'MVR',
      },
      promoCode: promoCodeDetails,
    };
  }

  /**
   * Calculate office quote based on sqft tiers and add-ons
   */
  private async calculateOfficeQuote(params: {
    squareFeet: number;
    rooms: number;
    toilets: number;
    frequency: SubscriptionFrequency | null;
  }) {
    const { squareFeet, rooms, toilets, frequency } = params;

    // Debug logging
    console.log('=== calculateOfficeQuote DEBUG ===');
    console.log('Input params:', { squareFeet, rooms, toilets, frequency });

    // 1. Find matching sqft tier
    const tier = await this.prisma.officePricingTier.findFirst({
      where: {
        sqftMin: { lte: squareFeet },
        sqftMax: { gte: squareFeet },
        frequency: frequency,
        isActive: true,
      },
    });

    console.log('Found tier:', tier);
    console.log('Tier basePrice raw:', tier?.basePrice);
    console.log('Tier basePrice as Number:', Number(tier?.basePrice));

    if (!tier) {
      // Log available tiers for debugging
      const allTiers = await this.prisma.officePricingTier.findMany({
        where: { isActive: true },
        select: { sqftMin: true, sqftMax: true, basePrice: true, frequency: true },
      });
      console.log('Available tiers:', allTiers);

      throw new NotFoundException(
        `No pricing tier found for ${squareFeet} sqft. Please contact support.`,
      );
    }

    let sqftBasePrice = Number(tier.basePrice);
    let roomAddOnTotal = 0;
    let toiletAddOnTotal = 0;

    // 2. Calculate room add-on (if rooms > 1)
    if (rooms > 1) {
      const roomAddOn = await this.prisma.officeAddOnPricing.findFirst({
        where: {
          addOnType: 'ROOM',
          isActive: true,
        },
        orderBy: { minQuantity: 'asc' },
      });

      if (roomAddOn) {
        roomAddOnTotal = Number(roomAddOn.pricePerUnit) * (rooms - 1);
      }
    }

    // 3. Calculate toilet add-on (if toilets > 1)
    if (toilets > 1) {
      const toiletAddOn = await this.prisma.officeAddOnPricing.findFirst({
        where: {
          addOnType: 'TOILET',
          isActive: true,
        },
        orderBy: { minQuantity: 'asc' },
      });

      if (toiletAddOn) {
        toiletAddOnTotal = Number(toiletAddOn.pricePerUnit) * (toilets - 1);
      }
    }

    const totalPrice = sqftBasePrice + roomAddOnTotal + toiletAddOnTotal;

    console.log('Price breakdown:', {
      sqftBasePrice,
      roomAddOnTotal,
      toiletAddOnTotal,
      totalPrice,
    });
    console.log('=== END calculateOfficeQuote DEBUG ===');

    return {
      sqftTierPrice: sqftBasePrice,
      sqftTierId: tier.id,
      roomAddOn: roomAddOnTotal,
      toiletAddOn: toiletAddOnTotal,
      totalPrice,
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

    // Get minimum price for OFFICE service from OfficePricingTier table
    const officeMinPrice = await this.prisma.officePricingTier.findFirst({
      where: {
        isActive: true,
      },
      orderBy: { basePrice: 'asc' },
    });

    return {
      home: {
        minPrice: homeMinPrice ? Number(homeMinPrice.price) : null,
        currency: 'MVR',
      },
      office: {
        minPrice: officeMinPrice ? Number(officeMinPrice.basePrice) : null,
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
