import { IsDateString, IsNotEmpty, IsOptional, IsEnum, IsInt, IsString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ServiceType } from '@prisma/client';

export class SubscriptionAvailabilityQueryDto {
  @ApiProperty({
    description: 'Start date for the subscription (YYYY-MM-DD)',
    example: '2025-01-15',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    description: 'Day of week to check (0=Sunday, 6=Saturday)',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiPropertyOptional({
    description: 'Service type (HOME or OFFICE)',
    enum: ServiceType,
  })
  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;

  @ApiPropertyOptional({
    description: 'Number of bedrooms (for HOME service)',
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  bedrooms?: number;

  @ApiPropertyOptional({
    description: 'Office size (for OFFICE service)',
  })
  @IsOptional()
  @IsString()
  officeSize?: string;

  @ApiPropertyOptional({
    description: 'Number of floors (for OFFICE service)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  floors?: number;

  @ApiPropertyOptional({
    description: 'Number of rooms (for OFFICE service)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  rooms?: number;
}
