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

  // Office cleaning parameters
  @ApiPropertyOptional({
    example: 250,
    description: 'Square feet of office (required for OFFICE service)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @ValidateIf((o) => o.serviceType === ServiceType.OFFICE)
  squareFeet?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Number of floors (optional for OFFICE service)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  floors?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Number of rooms (required for OFFICE service)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ValidateIf((o) => o.serviceType === ServiceType.OFFICE)
  rooms?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Number of toilets (required for OFFICE service)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ValidateIf((o) => o.serviceType === ServiceType.OFFICE)
  toilets?: number;

  @ApiPropertyOptional({
    example: 'PROMO10',
    description: 'Promo code to apply',
  })
  @IsString()
  @IsOptional()
  promoCode?: string;
}
