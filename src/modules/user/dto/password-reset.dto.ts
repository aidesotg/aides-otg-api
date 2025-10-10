import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PasswordResetDto {
  @ApiProperty() @IsString() token: string;
  @ApiProperty() @IsString() password: string;
}

export class PasswordResetSelf {
  @ApiProperty() @IsString() old_password: string;
  @ApiProperty() @IsString() new_password: string;
}

export class PasswordResetAdmin {
  @ApiProperty() @IsString() user: string;
  @ApiProperty() @IsString() password: string;
}
