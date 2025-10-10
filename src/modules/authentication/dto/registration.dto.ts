import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail } from 'class-validator';

export class RegistrationDto {
  @ApiProperty() @IsString() fullname: string;
  @ApiProperty() @IsString() username: string;
  @ApiProperty() @IsString() password: string;
  @ApiProperty() @IsString() country: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() @IsOptional() referred_by: string;
}
