import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class PasswordResetAuthDto {
  @ApiProperty() @IsString() token: string;
}
