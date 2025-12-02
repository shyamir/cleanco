import { IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AvailableSlotsQueryDto {
  @ApiProperty({
    description: 'Date to check available slots (YYYY-MM-DD)',
    example: '2025-01-15',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;
}
