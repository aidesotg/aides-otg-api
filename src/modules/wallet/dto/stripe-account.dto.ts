import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class StripeAccountDto {
  @ApiProperty() @IsString() return_url: string;
  @ApiProperty() @IsString() reauth_url: string;
}
