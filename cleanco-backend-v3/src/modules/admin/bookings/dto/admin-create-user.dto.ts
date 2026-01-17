import { IsNotEmpty, IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminCreateUserDto {
  @ApiProperty({ description: 'First name of the customer' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiPropertyOptional({ description: 'Last name of the customer' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ description: 'Phone number of the customer', example: '+9607123456' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Email address of the customer' })
  @IsEmail()
  @IsOptional()
  email?: string;
}
