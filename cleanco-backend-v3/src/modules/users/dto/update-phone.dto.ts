import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePhoneDto {
  @ApiProperty({
    example: '+9607123456',
    description: 'New phone number in format +960XXXXXXX'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+960[79]\d{6}$/, {
    message: 'Phone number must be a valid Maldives number (+960 followed by 7 digits starting with 7 or 9)'
  })
  newPhoneNumber: string;

  @ApiProperty({
    example: '123456',
    description: 'OTP code sent to the new phone number for verification'
  })
  @IsString()
  @IsNotEmpty()
  otp: string;
}
