import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsArray,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsOptional,
  IsString,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ServiceType, SubscriptionFrequency } from '@prisma/client';

// Day slot DTO for subscription day-timeslot pairs
export class DaySlotDto {
  @ApiProperty({ description: 'Day of week (0=Sunday, 1=Monday, etc.)', example: 1 })
  @IsInt()
  @Min(0)
  @Max(6)
  day: number;

  @ApiProperty({ description: 'Time slot ID for this day', example: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  timeSlotId: string;
}

export class CreateSubscriptionDto {
  @ApiProperty({ enum: ServiceType, description: 'Type of service (HOME or OFFICE)' })
  @IsEnum(ServiceType)
  @IsNotEmpty()
  serviceType: ServiceType;

  @ApiProperty({ enum: SubscriptionFrequency, description: 'Frequency of cleaning' })
  @IsEnum(SubscriptionFrequency)
  @IsNotEmpty()
  frequency: SubscriptionFrequency;

  @ApiProperty({ description: 'Address ID for the subscription', example: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  addressId: string;

  @ApiProperty({
    description: 'Day slots with day and time slot ID for each day',
    type: [DaySlotDto],
    example: [{ day: 1, timeSlotId: 'uuid1' }, { day: 3, timeSlotId: 'uuid2' }],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => DaySlotDto)
  daySlots: DaySlotDto[];

  // Home cleaning specific fields
  @ApiPropertyOptional({ description: 'Number of bedrooms (for HOME service)', example: 3 })
  @ValidateIf((o) => o.serviceType === ServiceType.HOME)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  bedrooms?: number;

  @ApiPropertyOptional({ description: 'Number of bathrooms (for HOME service)', example: 2 })
  @ValidateIf((o) => o.serviceType === ServiceType.HOME)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  bathrooms?: number;

  @ApiPropertyOptional({ description: 'Does the home have pets?', example: false })
  @IsBoolean()
  @IsOptional()
  hasPets?: boolean;

  // Office cleaning specific fields
  @ApiPropertyOptional({
    description: 'Office size (for OFFICE service)',
    example: 'MEDIUM',
    enum: ['SMALL', 'MEDIUM', 'LARGE'],
  })
  @ValidateIf((o) => o.serviceType === ServiceType.OFFICE)
  @IsString()
  @IsOptional()
  officeSize?: string;

  @ApiPropertyOptional({ description: 'Number of floors (for OFFICE service)', example: 2 })
  @ValidateIf((o) => o.serviceType === ServiceType.OFFICE)
  @IsInt()
  @Min(1)
  @IsOptional()
  floors?: number;

  @ApiPropertyOptional({ description: 'Number of rooms (for OFFICE service)', example: 10 })
  @ValidateIf((o) => o.serviceType === ServiceType.OFFICE)
  @IsInt()
  @Min(1)
  @IsOptional()
  rooms?: number;

  @ApiPropertyOptional({ description: 'Square footage (for OFFICE service)', example: 500 })
  @ValidateIf((o) => o.serviceType === ServiceType.OFFICE)
  @IsInt()
  @Min(100)
  @IsOptional()
  squareFeet?: number;

  @ApiPropertyOptional({ description: 'Number of toilets (for OFFICE service)', example: 2 })
  @ValidateIf((o) => o.serviceType === ServiceType.OFFICE)
  @IsInt()
  @Min(1)
  @IsOptional()
  toilets?: number;
}
