import {
  IsEnum,
  IsInt,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionFrequency } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateHomePricingRuleDto {
  @ApiPropertyOptional({
    enum: SubscriptionFrequency,
    description: 'Subscription frequency (null for one-time bookings)',
  })
  @IsEnum(SubscriptionFrequency)
  @IsOptional()
  frequency?: SubscriptionFrequency;

  @ApiProperty({
    example: 3,
    description: 'Number of bedrooms',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  bedrooms: number;

  @ApiProperty({
    example: 250.50,
    description: 'Price in MVR',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the pricing rule is active',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
