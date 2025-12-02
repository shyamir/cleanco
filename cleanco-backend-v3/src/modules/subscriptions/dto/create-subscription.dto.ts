import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
} from 'class-validator';
import { ServiceType, SubscriptionFrequency } from '@prisma/client';

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

  @ApiProperty({ description: 'Time slot ID for the subscription', example: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  timeSlotId: string;

  @ApiProperty({
    description: 'Selected days of the week (0=Sunday, 1=Monday, etc.)',
    type: [Number],
    example: [1, 3, 5],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  selectedDays: number[];

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
  @IsNotEmpty()
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
}
