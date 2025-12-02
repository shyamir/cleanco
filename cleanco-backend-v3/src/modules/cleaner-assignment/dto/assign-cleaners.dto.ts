import { IsArray, IsNotEmpty, IsString, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignCleanersDto {
  @ApiProperty({
    description: 'Array of cleaner profile IDs to assign to the booking',
    example: ['cleaner-uuid-1', 'cleaner-uuid-2'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one cleaner must be assigned' })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  cleanerIds: string[];
}
