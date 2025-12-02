import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsPhoneNumber,
  IsNotEmpty,
  Length,
  IsOptional,
  IsEmail,
} from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Phone number with country code',
    example: '+9607777777',
  })
  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber('MV', { message: 'Invalid phone number format' })
  phoneNumber: string;

  @ApiProperty({
    description: 'OTP code received via SMS',
    example: '123456',
    minLength: 4,
    maxLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 6, { message: 'OTP must be 4-6 digits' })
  code: string;

  @ApiProperty({
    description: 'First name (required for new users)',
    example: 'Ahmed',
    required: false,
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    description: 'Last name (required for new users)',
    example: 'Mohamed',
    required: false,
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    description: 'Email address (optional)',
    example: 'ahmed@example.com',
    required: false,
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsOptional()
  email?: string;
}
