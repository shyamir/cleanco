import { IsDateString, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RescheduleBookingDto {
  @ApiProperty({ description: 'New booking date (YYYY-MM-DD)', example: '2025-01-20' })
  @IsDateString()
  @IsNotEmpty()
  newDate: string;

  @ApiProperty({ description: 'New time slot ID' })
  @IsString()
  @IsNotEmpty()
  newTimeSlotId: string;
}
