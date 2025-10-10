import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSettingDto {
  @ApiProperty() @IsString() siteTitle: string;
  @ApiProperty() @IsString() siteSubtitle: string;
  @ApiProperty() @IsString() currency: string;
  @ApiProperty() @IsNumber() minimumOrderAmount: number;
  @ApiProperty() @IsNumber() @IsOptional() walletToCurrencyRatio: number;
  @ApiProperty() @IsNumber() @IsOptional() signupPoints: number;
}
