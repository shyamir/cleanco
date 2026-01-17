import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  IsOptional,
  IsBoolean,
  IsDateString,
  ValidateIf,
  ValidateNested,
  IsArray,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ServiceType, PaymentMethod } from '@prisma/client';

class NewUserDto {
  @ApiProperty({ description: 'First name of the new customer' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiPropertyOptional({ description: 'Last name of the new customer' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ description: 'Phone number of the new customer', example: '+9607123456' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}

class DaySlotDto {
  @ApiProperty({ description: 'Day of week (0=Sunday, 6=Saturday)', minimum: 0, maximum: 6 })
  @IsInt()
  @Min(0)
  dayOfWeek: number;

  @ApiProperty({ description: 'Time slot ID for this day' })
  @IsString()
  @IsNotEmpty()
  timeSlotId: string;
}

export class AdminCreateBookingDto {
  // User - either existing or new
  @ApiPropertyOptional({ description: 'Existing customer ID' })
  @ValidateIf((o) => !o.newUser)
  @IsString()
  @IsNotEmpty()
  userId?: string;

  @ApiPropertyOptional({ description: 'Create new customer (if userId not provided)', type: NewUserDto })
  @ValidateIf((o) => !o.userId)
  @ValidateNested()
  @Type(() => NewUserDto)
  newUser?: NewUserDto;

  @ApiProperty({ description: 'Service type', enum: ServiceType })
  @IsEnum(ServiceType)
  @IsNotEmpty()
  serviceType: ServiceType;

  @ApiProperty({ description: 'Address ID where service will be performed' })
  @IsString()
  @IsNotEmpty()
  addressId: string;

  // For one-time bookings
  @ApiPropertyOptional({ description: 'Booking date (YYYY-MM-DD) - for one-time bookings', example: '2025-01-20' })
  @ValidateIf((o) => o.frequency === 'Once')
  @IsDateString()
  @IsNotEmpty()
  date?: string;

  @ApiPropertyOptional({ description: 'Time slot ID - for one-time bookings' })
  @ValidateIf((o) => o.frequency === 'Once')
  @IsString()
  @IsNotEmpty()
  timeSlotId?: string;

  // For subscription bookings
  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD) - for subscriptions', example: '2025-01-20' })
  @ValidateIf((o) => o.frequency !== 'Once')
  @IsDateString()
  @IsNotEmpty()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Day and time slot selections - for subscriptions', type: [DaySlotDto] })
  @ValidateIf((o) => o.frequency !== 'Once')
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DaySlotDto)
  daySlots?: DaySlotDto[];

  // HOME service parameters
  @ApiPropertyOptional({ description: 'Number of bedrooms (required for HOME service)' })
  @ValidateIf((o) => o.serviceType === ServiceType.HOME)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  bedrooms?: number;

  @ApiPropertyOptional({ description: 'Number of bathrooms (required for HOME service)' })
  @ValidateIf((o) => o.serviceType === ServiceType.HOME)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  bathrooms?: number;

  // OFFICE service parameters
  @ApiPropertyOptional({ description: 'Square feet of office (required for OFFICE service)', example: 250 })
  @ValidateIf((o) => o.serviceType === ServiceType.OFFICE)
  @IsInt()
  @Min(100)
  @IsNotEmpty()
  squareFeet?: number;

  @ApiPropertyOptional({ description: 'Number of floors (optional for OFFICE service)' })
  @IsInt()
  @Min(1)
  @IsOptional()
  floors?: number;

  @ApiPropertyOptional({ description: 'Number of rooms (required for OFFICE service)' })
  @ValidateIf((o) => o.serviceType === ServiceType.OFFICE)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  rooms?: number;

  @ApiPropertyOptional({ description: 'Number of toilets (required for OFFICE service)' })
  @ValidateIf((o) => o.serviceType === ServiceType.OFFICE)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  toilets?: number;

  // Common fields
  @ApiProperty({ description: 'Booking frequency', example: 'Once' })
  @IsString()
  @IsNotEmpty()
  frequency: string;

  @ApiPropertyOptional({ description: 'Has pets', default: false })
  @IsBoolean()
  @IsOptional()
  hasPets?: boolean;

  @ApiPropertyOptional({ description: 'Type of pet (if hasPets is true)', example: 'Cat' })
  @IsString()
  @IsOptional()
  petType?: string;

  @ApiPropertyOptional({ description: 'Special instructions for cleaners' })
  @IsString()
  @IsOptional()
  specialInstructions?: string;

  @ApiPropertyOptional({ description: 'Promotional code to apply' })
  @IsString()
  @IsOptional()
  promoCode?: string;

  @ApiPropertyOptional({ description: 'Payment method', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;
}
