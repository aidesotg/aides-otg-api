import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SaveCallSidDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  callSid: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  dayId: string;
}
