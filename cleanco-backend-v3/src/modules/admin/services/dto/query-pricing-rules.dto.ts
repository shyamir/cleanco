import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType } from '@prisma/client';

export class QueryPricingRulesDto {
  @ApiPropertyOptional({
    enum: ServiceType,
    description: 'Filter by service type',
  })
  @IsEnum(ServiceType)
  @IsOptional()
  serviceType?: ServiceType;
}
