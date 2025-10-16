import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @ApiProperty()
  @MinLength(1, {
    message: 'channel_id cannot be less than 1 character',
  })
  channel_id?: string;

  @IsString()
  @ApiProperty()
  type: string;

  @IsString()
  @ApiProperty()
  @MinLength(1, {
    message: 'Message cannot be less than 1 character',
  })
  message: string;
}
