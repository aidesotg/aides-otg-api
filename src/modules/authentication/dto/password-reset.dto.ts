import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class PasswordResetDto {
  @ApiProperty() @IsString() email: string;
  @ApiProperty() @IsString() password: string;
}
