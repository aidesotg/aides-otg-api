import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class WithdrawDto {
  @ApiProperty() @IsString() processor: string;
  @ApiProperty() @IsString() @IsOptional() currency: string;
  @ApiProperty() @IsString() @IsOptional() bank_code: string;
  @ApiProperty() @IsString() @IsOptional() account_number: string;
  @ApiProperty() @IsNumber() amount: number;
}
