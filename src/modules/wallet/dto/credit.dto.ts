import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreditDto {
  @ApiProperty() @IsNumber() amount: number;
  @ApiProperty() @IsString() @IsOptional() currency: string;
  @ApiProperty() @IsString() payment_method: string;
  @ApiProperty() @IsString() @IsOptional() type: string;
  @ApiProperty() @IsString() @IsOptional() path: string;
}
