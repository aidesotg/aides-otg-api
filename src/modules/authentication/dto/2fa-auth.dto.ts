import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsMongoId } from 'class-validator';

export class TwoFactorLoginRequestDto {
  @ApiProperty() @IsString() method: string;
  @ApiProperty() @IsMongoId() userId: string;
}

export class TwoFactorLoginVerificationDto {
  @ApiProperty() @IsString() method: string;
  @ApiProperty() @IsMongoId() userId: string;
  @ApiProperty() @IsString() token: string;
}
