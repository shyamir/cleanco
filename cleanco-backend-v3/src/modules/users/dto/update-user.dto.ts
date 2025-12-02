import { IsString, IsOptional, IsEmail, ValidateIf, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ example: 'John', description: 'First name is required' })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @ApiPropertyOptional({ example: 'Doe', nullable: true })
  @ValidateIf((obj, value) => value !== null)
  @IsString()
  @IsOptional()
  lastName?: string | null;

  @ApiPropertyOptional({ example: 'john@example.com', nullable: true })
  @ValidateIf((obj, value) => value !== null)
  @IsEmail()
  @IsOptional()
  email?: string | null;
}
