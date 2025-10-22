import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  IsNotEmpty,
  IsEmail,
  MaxLength,
  IsMongoId,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @MinLength(2, {
    message: 'name too short',
  })
  first_name: string;

  @ApiProperty()
  @IsString()
  @MinLength(2, {
    message: 'name too short',
  })
  last_name: string;

  @ApiProperty() @IsEmail() email: string;

  @ApiProperty() @IsMongoId() roleId: string;

  @ApiProperty() @IsString() phone: string;
}

export class UpdateUserDto {
  @ApiProperty()
  @IsString()
  @MinLength(2, {
    message: 'name too short',
  })
  @IsOptional()
  first_name: string;

  @ApiProperty()
  @IsString()
  @MinLength(2, {
    message: 'name too short',
  })
  @IsOptional()
  last_name: string;

  @ApiProperty() @IsEmail() @IsOptional() email: string;

  @ApiProperty() @IsMongoId() @IsOptional() roleId: string;

  @ApiProperty() @IsString() @IsOptional() phone: string;
}
