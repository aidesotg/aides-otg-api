import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty() @IsString() @IsOptional() fullname?: string;
  @ApiProperty() @IsString() @IsOptional() bvn: string;
  @ApiProperty() @IsString() @IsOptional() occupation: string;
  @ApiProperty() @IsString() @IsOptional() description: string;
  @ApiProperty() @IsString() @IsOptional() country: string;
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
  @ApiProperty() @IsString() @IsOptional() username?: string;
}
