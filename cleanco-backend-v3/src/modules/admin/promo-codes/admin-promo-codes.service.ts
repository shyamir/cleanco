import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreatePromoCodeDto, UpdatePromoCodeDto } from './dto';
import { PromotionalCode } from '@prisma/client';

@Injectable()
export class AdminPromoCodesService {
  private readonly logger = new Logger(AdminPromoCodesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all promo codes with pagination
   */
  async findAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{
    data: PromotionalCode[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params?.search) {
      where.code = { contains: params.search, mode: 'insensitive' };
    }

    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const [promoCodes, total] = await Promise.all([
      this.prisma.promotionalCode.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { usages: true },
          },
        },
      }),
      this.prisma.promotionalCode.count({ where }),
    ]);

    return {
      data: promoCodes,
      total,
      page,
      limit,
    };
  }

  /**
   * Get promo code by ID
   */
  async findById(id: string): Promise<PromotionalCode & { usageCount: number }> {
    const promoCode = await this.prisma.promotionalCode.findUnique({
      where: { id },
      include: {
        _count: {
          select: { usages: true },
        },
      },
    });

    if (!promoCode) {
      throw new NotFoundException('Promo code not found');
    }

    return {
      ...promoCode,
      usageCount: promoCode._count.usages,
    };
  }

  /**
   * Create a new promo code
   */
  async create(
    createDto: CreatePromoCodeDto,
    adminId: string,
  ): Promise<PromotionalCode> {
    // Check if code already exists
    const existingCode = await this.prisma.promotionalCode.findUnique({
      where: { code: createDto.code },
    });

    if (existingCode) {
      throw new ConflictException('Promo code already exists');
    }

    const promoCode = await this.prisma.promotionalCode.create({
      data: {
        code: createDto.code,
        discountType: createDto.discountType,
        discountValue: createDto.discountValue,
        startDate: new Date(createDto.startDate),
        endDate: new Date(createDto.endDate),
        usageLimitPerUser: createDto.usageLimitPerUser ?? 1,
        totalUsageLimit: createDto.totalUsageLimit,
        applicableServices: createDto.applicableServices ?? [],
        minPurchaseAmount: createDto.minPurchaseAmount,
        isActive: createDto.isActive ?? true,
        isPublic: createDto.isPublic ?? true,
        createdBy: adminId,
      },
    });

    this.logger.log(`Promo code created: ${promoCode.code} by admin ${adminId}`);

    return promoCode;
  }

  /**
   * Update a promo code
   */
  async update(id: string, updateDto: UpdatePromoCodeDto): Promise<PromotionalCode> {
    const existingPromoCode = await this.prisma.promotionalCode.findUnique({
      where: { id },
    });

    if (!existingPromoCode) {
      throw new NotFoundException('Promo code not found');
    }

    const updateData: any = {};

    if (updateDto.discountType !== undefined) {
      updateData.discountType = updateDto.discountType;
    }
    if (updateDto.discountValue !== undefined) {
      updateData.discountValue = updateDto.discountValue;
    }
    if (updateDto.startDate !== undefined) {
      updateData.startDate = new Date(updateDto.startDate);
    }
    if (updateDto.endDate !== undefined) {
      updateData.endDate = new Date(updateDto.endDate);
    }
    if (updateDto.usageLimitPerUser !== undefined) {
      updateData.usageLimitPerUser = updateDto.usageLimitPerUser;
    }
    if (updateDto.totalUsageLimit !== undefined) {
      updateData.totalUsageLimit = updateDto.totalUsageLimit;
    }
    if (updateDto.applicableServices !== undefined) {
      updateData.applicableServices = updateDto.applicableServices;
    }
    if (updateDto.minPurchaseAmount !== undefined) {
      updateData.minPurchaseAmount = updateDto.minPurchaseAmount;
    }
    if (updateDto.isActive !== undefined) {
      updateData.isActive = updateDto.isActive;
    }
    if (updateDto.isPublic !== undefined) {
      updateData.isPublic = updateDto.isPublic;
    }

    const promoCode = await this.prisma.promotionalCode.update({
      where: { id },
      data: updateData,
    });

    this.logger.log(`Promo code updated: ${promoCode.code}`);

    return promoCode;
  }

  /**
   * Delete a promo code
   */
  async delete(id: string): Promise<void> {
    const existingPromoCode = await this.prisma.promotionalCode.findUnique({
      where: { id },
      include: {
        _count: { select: { usages: true } },
      },
    });

    if (!existingPromoCode) {
      throw new NotFoundException('Promo code not found');
    }

    // If promo code has been used, just deactivate it
    if (existingPromoCode._count.usages > 0) {
      await this.prisma.promotionalCode.update({
        where: { id },
        data: { isActive: false },
      });
      this.logger.log(`Promo code deactivated (had usages): ${existingPromoCode.code}`);
    } else {
      // If never used, delete it
      await this.prisma.promotionalCode.delete({
        where: { id },
      });
      this.logger.log(`Promo code deleted: ${existingPromoCode.code}`);
    }
  }

  /**
   * Toggle promo code active status
   */
  async toggleActive(id: string): Promise<PromotionalCode> {
    const promoCode = await this.prisma.promotionalCode.findUnique({
      where: { id },
    });

    if (!promoCode) {
      throw new NotFoundException('Promo code not found');
    }

    return this.prisma.promotionalCode.update({
      where: { id },
      data: { isActive: !promoCode.isActive },
    });
  }
}
