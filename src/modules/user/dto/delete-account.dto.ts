import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DeleteAccountDto {
  @ApiProperty() @IsString() @IsOptional() reason?: string;
  @ApiProperty() @IsString() @IsOptional() comment?: string;
  @ApiProperty() @IsString() password: string;
}
