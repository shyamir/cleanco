import { PartialType } from '@nestjs/swagger';
import { CreateOfficePricingTierDto } from './create-office-pricing-tier.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOfficePricingTierDto extends PartialType(CreateOfficePricingTierDto) {
  @ApiPropertyOptional({
    example: true,
    description: 'Whether this pricing tier is active',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
