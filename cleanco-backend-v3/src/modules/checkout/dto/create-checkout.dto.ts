import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export enum CheckoutTypeDto {
  BOOKING = 'BOOKING',
  SUBSCRIPTION = 'SUBSCRIPTION',
}

export class CreateCheckoutDto {
  @ApiProperty({
    enum: CheckoutTypeDto,
    description: 'Type of checkout (BOOKING or SUBSCRIPTION)',
  })
  @IsEnum(CheckoutTypeDto)
  @IsNotEmpty()
  type: CheckoutTypeDto;

  @ApiProperty({
    description: 'The booking or subscription details as JSON',
    example: {
      serviceType: 'HOME',
      bookingType: 'ONE_TIME',
      addressId: 'uuid',
      date: '2025-01-15',
      timeSlotId: 'uuid',
      bedrooms: 3,
      bathrooms: 2,
    },
  })
  @IsNotEmpty()
  details: Record<string, any>;
}

export class CheckoutSessionResponse {
  @ApiProperty({ description: 'Checkout session ID' })
  checkoutSessionId: string;

  @ApiProperty({ description: 'Expiration timestamp' })
  expiresAt: Date;

  @ApiProperty({ description: 'Hold duration in seconds', example: 300 })
  holdDurationSeconds: number;

  @ApiProperty({ description: 'Calculated price for the booking/subscription' })
  price: {
    basePrice: number;
    discountAmount: number;
    finalPrice: number;
  };
}
