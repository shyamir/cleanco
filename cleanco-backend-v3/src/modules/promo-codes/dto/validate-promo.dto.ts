import { IsEnum, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ServiceType } from '@prisma/client';
import { Type } from 'class-transformer';

export class ValidatePromoDto {
  @ApiProperty({
    example: 'PROMO10',
    description: 'Promo code to validate',
  })
  @IsString()
  code: string;

  @ApiProperty({
    enum: ServiceType,
    example: ServiceType.HOME,
    description: 'Service type to validate the promo against',
  })
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ApiProperty({
    example: 500,
    description: 'Purchase amount to validate minimum requirement',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  purchaseAmount: number;
}
