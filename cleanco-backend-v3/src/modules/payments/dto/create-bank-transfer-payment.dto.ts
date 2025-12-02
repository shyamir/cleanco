import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUrl, IsUUID } from 'class-validator';

export class CreateBankTransferPaymentDto {
  @ApiProperty({
    description: 'Booking ID for which payment is being made',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({
    description: 'URL to the uploaded payment receipt',
    example: 'https://storage.example.com/receipts/receipt-123.jpg',
  })
  @IsUrl()
  @IsNotEmpty()
  receiptUrl: string;
}
