import { IsString, IsOptional, IsNumber, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiPropertyOptional({ example: 'Home', description: 'Label for the address (e.g., Home, Office)' })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiProperty({ example: 'Apt 5A, Floor 3', description: 'House/Apt number, floor, etc.' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'Majeedhee Magu', description: 'Street/Magu name' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: 'Near STO', description: 'Landmark/Goalhi' })
  @IsString()
  @IsNotEmpty()
  landmark: string;

  @ApiProperty({ example: 'uuid', description: 'Zone ID' })
  @IsUUID()
  @IsNotEmpty()
  zoneId: string;

  @ApiPropertyOptional({ example: 4.1755, description: 'Latitude coordinate' })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: 73.5093, description: 'Longitude coordinate' })
  @IsNumber()
  @IsOptional()
  longitude?: number;
}
