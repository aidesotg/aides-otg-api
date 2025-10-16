import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class DeleteMessageDto {
  @IsString()
  @ApiProperty()
  channelId: string;

  @ApiProperty()
  @IsArray()
  messageIds: string[];
}
