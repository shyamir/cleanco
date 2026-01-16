import {
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsArray,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiscountType, ServiceType } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreatePromoCodeDto {
  @ApiProperty({ description: 'Promo code (will be uppercased)', example: 'SAVE20' })
  @IsString()
  @MaxLength(20)
  @Transform(({ value }) => value.toUpperCase())
  code: string;

  @ApiProperty({ description: 'Type of discount', enum: DiscountType })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({ description: 'Discount value', example: 20 })
  @IsNumber()
  @Min(0)
  discountValue: number;

  @ApiProperty({ description: 'Start date (YYYY-MM-DD)', example: '2024-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date (YYYY-MM-DD)', example: '2024-12-31' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Usage limit per user', default: 1 })
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

  @ApiPropertyOptional({ description: 'Whether the promo is active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Whether the promo is public', default: true })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
