import { IsBoolean, IsString } from 'class-validator';

export class CreateBroadcastDto {
  @IsString() title: string;
  @IsString() body: string;
  @IsBoolean() isDraft: boolean;
}
