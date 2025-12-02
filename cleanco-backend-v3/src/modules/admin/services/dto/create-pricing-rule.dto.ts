import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType, SubscriptionFrequency } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreatePricingRuleDto {
  @ApiProperty({
    enum: ServiceType,
    example: ServiceType.HOME,
    description: 'Service type',
  })
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ApiPropertyOptional({
    enum: SubscriptionFrequency,
    description: 'Subscription frequency (null for one-time bookings)',
  })
  @IsEnum(SubscriptionFrequency)
  @IsOptional()
  frequency?: SubscriptionFrequency;

  // Home cleaning parameters
  @ApiPropertyOptional({
    example: 3,
    description: 'Number of bedrooms (for HOME service)',
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
    description: 'Office size: Small, Medium, Large (for OFFICE service)',
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

  @ApiProperty({
    example: 250.50,
    description: 'Price in MVR',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;
}
