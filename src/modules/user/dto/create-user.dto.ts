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

  @ApiProperty() @IsString() role: string;
}
