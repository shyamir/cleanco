import { IsString, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiPropertyOptional({ example: 'Home', description: 'Label for the address (e.g., Home, Office)' })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiProperty({ example: 'Majeedhee Magu, Male' })
  @IsString()
  @IsNotEmpty()
  streetAddress: string;

  @ApiProperty({ example: 'Male' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Male', description: 'Island name' })
  @IsString()
  @IsNotEmpty()
  island: string;

  @ApiPropertyOptional({ example: '20000' })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({ example: 4.1755, description: 'Latitude coordinate' })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: 73.5093, description: 'Longitude coordinate' })
  @IsNumber()
  @IsOptional()
  longitude?: number;
}
