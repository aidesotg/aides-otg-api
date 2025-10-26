import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CancelRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cancellation_reason: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  cancellation_note: string;
}
