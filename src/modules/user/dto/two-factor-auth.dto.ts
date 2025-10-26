import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length, IsNumber } from 'class-validator';

export class VerifyTwoFactorDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  token: string;
}

export class EnableTwoFactorDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  token: string;
}

export class DisableTwoFactorDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class VerifyTwoFactorSmsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  token: string;
}

export class EnableTwoFactorSmsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  token: string;
}

export class DisableTwoFactorSmsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class SetupTwoFactorSmsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;
}
