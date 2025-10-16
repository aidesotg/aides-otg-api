import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsMongoId } from 'class-validator';

export class RegistrationDto {
  @ApiProperty() @IsString() password: string;
  @ApiProperty() @IsString() phone: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsMongoId() roleId: string;
}
