import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsPhoneNumber, IsNotEmpty } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({
    description: 'Phone number with country code',
    example: '+9607777777',
  })
  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber('MV', { message: 'Invalid phone number format' })
  phoneNumber: string;
}
