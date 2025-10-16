import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class LoginDto {
  @ApiProperty() @IsString() email: string;
  @ApiProperty() @IsString() password: string;
  @ApiProperty() @IsString() @IsOptional() device_token: string;
}
