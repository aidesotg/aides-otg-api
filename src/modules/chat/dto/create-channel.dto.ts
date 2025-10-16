import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateChannelDto {
  @IsString()
  @ApiProperty()
  receiver_id: string;

  @IsString()
  @ApiProperty()
  @IsOptional()
  service_id: string;
}
