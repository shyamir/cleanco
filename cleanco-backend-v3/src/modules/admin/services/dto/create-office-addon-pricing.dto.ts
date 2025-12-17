import {
  IsString,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateOfficeAddOnPricingDto {
  @ApiProperty({
    example: 'ROOM',
    description: 'Add-on type: ROOM or TOILET',
    enum: ['ROOM', 'TOILET'],
  })
  @IsString()
  @IsIn(['ROOM', 'TOILET'])
  addOnType: 'ROOM' | 'TOILET';

  @ApiProperty({
    example: 2,
    description: 'Minimum quantity threshold that triggers this pricing (e.g., 2 means "2 or more")',
  })
  @Type(() => Number)
  @IsInt()
  @Min(2)
  minQuantity: number;

  @ApiProperty({
    example: 50,
    description: 'Price per additional unit in MVR',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerUnit: number;

  @ApiPropertyOptional({
    example: 'Additional charge per office room beyond the first',
    description: 'Description of this add-on pricing',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
