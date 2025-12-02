import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsArray,
  IsInt,
  Min,
  Max,
  IsOptional,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ description: 'Time slot ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  timeSlotId?: string;

  @ApiPropertyOptional({
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
  @IsOptional()
  selectedDays?: number[];
}
