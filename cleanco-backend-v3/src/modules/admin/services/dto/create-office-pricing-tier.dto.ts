import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionFrequency } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateOfficePricingTierDto {
  @ApiPropertyOptional({
    enum: SubscriptionFrequency,
    description: 'Subscription frequency (null for one-time bookings)',
  })
  @IsEnum(SubscriptionFrequency)
  @IsOptional()
  frequency?: SubscriptionFrequency;

  @ApiProperty({
    example: 100,
    description: 'Minimum square feet (inclusive)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sqftMin: number;

  @ApiProperty({
    example: 199,
    description: 'Maximum square feet (inclusive)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sqftMax: number;

  @ApiProperty({
    example: 500,
    description: 'Base price in MVR for this tier',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  basePrice: number;
}
