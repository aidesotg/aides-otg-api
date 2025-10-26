import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class BankDto {
  @ApiProperty()
  @IsString()
  bank_name: string;

  @ApiProperty()
  @IsString()
  account_number: string;

  @ApiProperty()
  @IsString()
  account_name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  routing_number: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  default: boolean;

  @ApiProperty()
  @IsEnum(['checking', 'savings'], {
    message: 'Allowed account types are: checking, savings',
  })
  @IsString()
  account_type: 'checking' | 'savings';
}
