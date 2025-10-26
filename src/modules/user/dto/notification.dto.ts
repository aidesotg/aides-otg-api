import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class NotificationSettingsDto {
  @ApiProperty()
  @IsBoolean()
  email: boolean;
  @ApiProperty()
  @IsBoolean()
  sms: boolean;
  @ApiProperty()
  @IsBoolean()
  push: boolean;
  @ApiProperty()
  @IsBoolean()
  session_updates: boolean;
  @ApiProperty()
  @IsBoolean()
  payment_updates: boolean;
  @ApiProperty()
  @IsBoolean()
  messages: boolean;
  @ApiProperty()
  @IsBoolean()
  reminders: boolean;
}
