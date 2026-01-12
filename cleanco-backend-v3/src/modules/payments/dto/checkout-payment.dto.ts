import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUrl, IsUUID } from 'class-validator';

export class CheckoutBankTransferPaymentDto {
  @ApiProperty({
    description: 'Checkout session ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  checkoutSessionId: string;

  @ApiPropertyOptional({
    description: 'URL to the uploaded payment receipt (optional)',
    example: 'https://storage.example.com/receipts/receipt-123.jpg',
  })
  @IsUrl()
  @IsOptional()
  receiptUrl?: string;
}

export class CheckoutBmlPaymentDto {
  @ApiProperty({
    description: 'Checkout session ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  checkoutSessionId: string;
}
