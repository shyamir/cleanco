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
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType, BookingType, PaymentMethod } from '@prisma/client';

export class CreateBookingDto {
  @ApiProperty({ description: 'Service type', enum: ServiceType })
  @IsEnum(ServiceType)
  @IsNotEmpty()
  serviceType: ServiceType;

  @ApiProperty({ description: 'Booking type', enum: BookingType })
  @IsEnum(BookingType)
  @IsNotEmpty()
  bookingType: BookingType;

  @ApiProperty({ description: 'Address ID where service will be performed' })
  @IsString()
  @IsNotEmpty()
  addressId: string;

  @ApiProperty({ description: 'Booking date (YYYY-MM-DD)', example: '2025-01-15' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ description: 'Time slot ID' })
  @IsString()
  @IsNotEmpty()
  timeSlotId: string;

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

  @ApiPropertyOptional({ description: 'Has pets', default: false })
  @IsBoolean()
  @IsOptional()
  hasPets?: boolean;

  // OFFICE service parameters
  @ApiPropertyOptional({ description: 'Office size (required for OFFICE service)', example: 'Medium' })
  @ValidateIf((o) => o.serviceType === ServiceType.OFFICE)
  @IsString()
  @IsNotEmpty()
  officeSize?: string;

  @ApiPropertyOptional({ description: 'Number of floors (required for OFFICE service)' })
  @ValidateIf((o) => o.serviceType === ServiceType.OFFICE)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  floors?: number;

  @ApiPropertyOptional({ description: 'Number of rooms (required for OFFICE service)' })
  @ValidateIf((o) => o.serviceType === ServiceType.OFFICE)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  rooms?: number;

  @ApiPropertyOptional({ description: 'Promotional code to apply' })
  @IsString()
  @IsOptional()
  promoCode?: string;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ description: 'Special instructions for cleaners' })
  @IsString()
  @IsOptional()
  specialInstructions?: string;
}
