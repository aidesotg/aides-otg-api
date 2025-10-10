import { IsString, MinLength } from 'class-validator';

export class PresignUrlDto {
  @IsString()
  file_name: string;

  @IsString()
  file_type: string;
}
