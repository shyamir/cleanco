import { IsDateString, IsNotEmpty, IsOptional, IsEnum, IsInt, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ServiceType } from '@prisma/client';

export class AvailableSlotsQueryDto {
  @ApiProperty({
    description: 'Date to check available slots (YYYY-MM-DD)',
    example: '2025-01-15',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

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

  @ApiPropertyOptional({
    description: 'Override required cleaners count (for admin reschedule when cleaners were manually adjusted)',
    example: 3,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  requiredCleaners?: number;
}
