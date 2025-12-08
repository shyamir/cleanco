import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ValidatePromoDto } from './dto/validate-promo.dto';
import { ServiceType } from '@prisma/client';

@Injectable()
export class PromoCodesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get active public promotional codes for carousel display
   */
  async getActivePublicPromos() {
    const now = new Date();

    const promos = await this.prisma.promotionalCode.findMany({
      where: {
        isActive: true,
        isPublic: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      select: {
        id: true,
        code: true,
        discountType: true,
        discountValue: true,
        applicableServices: true,
        minPurchaseAmount: true,
        totalUsageLimit: true,
        currentUsage: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter out promos that have reached their total usage limit
    return promos
      .filter((promo) => {
        if (promo.totalUsageLimit === null) return true;
        return promo.currentUsage < promo.totalUsageLimit;
      })
      .map((promo) => ({
        id: promo.id,
        code: promo.code,
        discountType: promo.discountType,
        discountValue: Number(promo.discountValue),
        applicableServices: promo.applicableServices,
        minPurchaseAmount: promo.minPurchaseAmount ? Number(promo.minPurchaseAmount) : null,
      }));
  }

  /**
   * Validate a promo code for a specific user
   */
  async validatePromoForUser(
    userId: string,
    validateDto: ValidatePromoDto,
  ): Promise<{
    valid: boolean;
    discount: number;
    discountType: string;
    discountValue: number;
    message?: string;
  }> {
    const { code, serviceType, purchaseAmount } = validateDto;

    // Find the promo code
    const promo = await this.prisma.promotionalCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    // Check if promo exists
    if (!promo) {
      return {
        valid: false,
        discount: 0,
        discountType: '',
        discountValue: 0,
        message: 'Invalid promo code',
      };
    }

    // Check if promo is active
    if (!promo.isActive) {
      return {
        valid: false,
        discount: 0,
        discountType: '',
        discountValue: 0,
        message: 'Promo code is no longer active',
      };
    }

    // Check date range
    const now = new Date();
    if (promo.startDate > now || promo.endDate < now) {
      return {
        valid: false,
        discount: 0,
        discountType: '',
        discountValue: 0,
        message: 'Promo code is expired or inactive',
      };
    }

    // Check total usage limit
    if (promo.totalUsageLimit && promo.currentUsage >= promo.totalUsageLimit) {
      return {
        valid: false,
        discount: 0,
        discountType: '',
        discountValue: 0,
        message: 'Promo code has reached its maximum usage limit',
      };
    }

    // Check per-user usage limit
    if (promo.usageLimitPerUser) {
      const userUsageCount = await this.prisma.promoCodeUsage.count({
        where: {
          promoCodeId: promo.id,
          userId,
        },
      });

      if (userUsageCount >= promo.usageLimitPerUser) {
        return {
          valid: false,
          discount: 0,
          discountType: '',
          discountValue: 0,
          message: 'You have already used this promo code the maximum number of times',
        };
      }
    }

    // Check service type applicability
    if (
      promo.applicableServices.length > 0 &&
      !promo.applicableServices.includes(serviceType)
    ) {
      const serviceNames = promo.applicableServices
        .map((s) => (s === ServiceType.HOME ? 'Home Cleaning' : 'Office Cleaning'))
        .join(' and ');
      return {
        valid: false,
        discount: 0,
        discountType: '',
        discountValue: 0,
        message: `Promo code is only applicable for ${serviceNames}`,
      };
    }

    // Check minimum purchase amount
    if (promo.minPurchaseAmount && purchaseAmount < Number(promo.minPurchaseAmount)) {
      return {
        valid: false,
        discount: 0,
        discountType: '',
        discountValue: 0,
        message: `Minimum purchase amount of ${promo.minPurchaseAmount} MVR required for this promo code`,
      };
    }

    // Calculate discount
    let discount: number;
    if (promo.discountType === 'PERCENTAGE') {
      discount = purchaseAmount * (Number(promo.discountValue) / 100);
    } else {
      discount = Number(promo.discountValue);
    }

    // Ensure discount doesn't exceed purchase amount
    discount = Math.min(discount, purchaseAmount);

    return {
      valid: true,
      discount,
      discountType: promo.discountType,
      discountValue: Number(promo.discountValue),
    };
  }
}
