import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAddressDto {
  @ApiPropertyOptional({ example: 'Home' })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({ example: 'Apt 5A, Floor 3', description: 'House/Apt number, floor, etc.' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Majeedhee Magu', description: 'Street/Magu name' })
  @IsString()
  @IsOptional()
  street?: string;

  @ApiPropertyOptional({ example: 'Near STO', description: 'Landmark/Goalhi' })
  @IsString()
  @IsOptional()
  landmark?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Zone ID' })
  @IsUUID()
  @IsOptional()
  zoneId?: string;

  @ApiPropertyOptional({ example: 4.1755 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: 73.5093 })
  @IsNumber()
  @IsOptional()
  longitude?: number;
}
