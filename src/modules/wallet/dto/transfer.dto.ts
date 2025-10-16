import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class TransferDto {
  @ApiProperty() @IsNumber() amount: number;
  @ApiProperty() @IsString() user_id: string;
  @ApiProperty() @IsString() @IsOptional() currency: string;
}
