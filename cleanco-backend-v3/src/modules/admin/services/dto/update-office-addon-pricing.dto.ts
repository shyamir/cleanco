import { PartialType } from '@nestjs/swagger';
import { CreateOfficeAddOnPricingDto } from './create-office-addon-pricing.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOfficeAddOnPricingDto extends PartialType(CreateOfficeAddOnPricingDto) {
  @ApiPropertyOptional({
    example: true,
    description: 'Whether this add-on pricing is active',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
