import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class VerifyPaymentDto {
  @ApiProperty({
    description: 'Payment verification status',
    enum: PaymentStatus,
    example: PaymentStatus.VERIFIED,
  })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiPropertyOptional({
    description: 'Reason for failure (if status is FAILED)',
    example: 'Invalid receipt or amount mismatch',
  })
  @IsString()
  @IsOptional()
  failureReason?: string;
}
