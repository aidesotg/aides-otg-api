import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreatePermissionDto {
  @IsString() module: string;
  @IsString() name: string;
  @IsString() description: string;
}
