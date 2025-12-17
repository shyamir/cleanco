import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ConfirmInspectionDto {
  @ApiProperty({
    example: 750,
    description: 'Confirmed price after inspection in MVR',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  confirmedPrice: number;

  @ApiPropertyOptional({
    example: 'Additional rooms found during inspection',
    description: 'Reason for price adjustment (if any)',
  })
  @IsString()
  @IsOptional()
  priceAdjustmentReason?: string;
}
