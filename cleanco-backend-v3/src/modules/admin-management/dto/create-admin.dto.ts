import { IsString, IsEmail, IsOptional, MinLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';

export class CreateAdminDto {
  @ApiProperty({ description: 'Admin username', example: 'admin2' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ description: 'Admin password', example: 'securepassword123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ description: 'Admin email', example: 'admin@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'First name', example: 'John' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name', example: 'Doe' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Admin role (only ADMIN allowed, SUPER_ADMIN cannot be created)',
    enum: ['ADMIN'],
    default: 'ADMIN',
  })
  @IsEnum(['ADMIN'])
  @IsOptional()
  role?: 'ADMIN';
}
