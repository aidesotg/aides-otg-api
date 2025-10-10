import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  IsNotEmpty,
  IsEmail,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @MinLength(2, {
    message: 'name too short',
  })
  fullname: string;

  @ApiProperty() @IsString() username: string;

  @ApiProperty() @IsEmail() email: string;

  @ApiProperty() @IsString() country: string;

  @ApiProperty()
  @IsString()
  @ApiProperty()
  @IsString()
  @MinLength(6, {
    message: 'Password too short',
  })
  @IsNotEmpty()
  password: string;

  @ApiProperty() @IsString() @IsOptional() role: string;
  @ApiProperty() @IsString() @IsOptional() bvn: string;
  @ApiProperty() @IsString() @IsOptional() occupation: string;
  @ApiProperty() @IsString() @IsOptional() description: string;
  @ApiProperty() @IsString() @IsOptional() nationality: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @MinLength(10, {
    message: 'Phone number too short',
  })
  @MaxLength(10, {
    message: 'Phone number too long',
  })
  phone?: string;

  @ApiProperty() @IsString() @IsOptional() profile_picture?: string;
}
