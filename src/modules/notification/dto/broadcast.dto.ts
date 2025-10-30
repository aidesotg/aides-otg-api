import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateBroadcastDto {
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsString() body: string;
  @ApiProperty() @IsBoolean() isDraft: boolean;
  @ApiProperty() @IsDateString() @IsOptional() scheduled_at: Date;
  @ApiProperty()
  @IsArray()
  @IsEnum(['email', 'in-app', 'push'], { each: true })
  channels: string[];
  @ApiProperty()
  @IsArray()
  @IsEnum(['all', 'clients', 'caregivers'], { each: true })
  audience: string[];
  // @ApiProperty()
  // @IsString()
  // @IsEnum(['draft', 'cancelled', 'scheduled'])
  // status: string;
}
