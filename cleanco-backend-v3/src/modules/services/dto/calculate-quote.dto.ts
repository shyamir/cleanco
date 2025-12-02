import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType, SubscriptionFrequency } from '@prisma/client';
import { Type } from 'class-transformer';

export class CalculateQuoteDto {
  @ApiProperty({
    enum: ServiceType,
    example: ServiceType.HOME,
    description: 'Type of cleaning service',
  })
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ApiPropertyOptional({
    enum: SubscriptionFrequency,
    description: 'Subscription frequency (leave empty for one-time booking)',
  })
  @IsEnum(SubscriptionFrequency)
  @IsOptional()
  frequency?: SubscriptionFrequency;

  // Home cleaning parameters
  @ApiPropertyOptional({
    example: 3,
    description: 'Number of bedrooms (required for HOME service)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ValidateIf((o) => o.serviceType === ServiceType.HOME)
  bedrooms?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Number of bathrooms',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  bathrooms?: number;

  // Office cleaning parameters
  @ApiPropertyOptional({
    example: 'Medium',
    description: 'Office size: Small, Medium, Large (required for OFFICE service)',
  })
  @IsString()
  @ValidateIf((o) => o.serviceType === ServiceType.OFFICE)
  officeSize?: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'Number of floors (for OFFICE service)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  floors?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of rooms (for OFFICE service)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  rooms?: number;

  @ApiPropertyOptional({
    example: 'PROMO10',
    description: 'Promo code to apply',
  })
  @IsString()
  @IsOptional()
  promoCode?: string;
}
