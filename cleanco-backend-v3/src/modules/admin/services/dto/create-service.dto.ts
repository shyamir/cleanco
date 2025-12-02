import { IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType } from '@prisma/client';

export class CreateServiceDto {
  @ApiProperty({
    enum: ServiceType,
    example: ServiceType.HOME,
    description: 'Type of service',
  })
  @IsEnum(ServiceType)
  type: ServiceType;

  @ApiProperty({
    example: 'Home Deep Cleaning',
    description: 'Service name',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Complete deep cleaning service for your home including all rooms, kitchen, and bathrooms',
    description: 'Service description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the service is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
