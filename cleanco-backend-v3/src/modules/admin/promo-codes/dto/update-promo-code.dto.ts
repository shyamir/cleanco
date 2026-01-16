import {
  IsEnum,
  IsNumber,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsArray,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DiscountType, ServiceType } from '@prisma/client';

export class UpdatePromoCodeDto {
  @ApiPropertyOptional({ description: 'Type of discount', enum: DiscountType })
  @IsEnum(DiscountType)
  @IsOptional()
  discountType?: DiscountType;

  @ApiPropertyOptional({ description: 'Discount value', example: 20 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountValue?: number;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)', example: '2024-01-01' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)', example: '2024-12-31' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Usage limit per user' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  usageLimitPerUser?: number;

  @ApiPropertyOptional({ description: 'Total usage limit for all users' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  totalUsageLimit?: number;

  @ApiPropertyOptional({
    description: 'Applicable service types',
    enum: ServiceType,
    isArray: true,
  })
  @IsArray()
  @IsEnum(ServiceType, { each: true })
  @IsOptional()
  applicableServices?: ServiceType[];

  @ApiPropertyOptional({ description: 'Minimum purchase amount in MVR' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minPurchaseAmount?: number;

  @ApiPropertyOptional({ description: 'Whether the promo is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Whether the promo is public' })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
