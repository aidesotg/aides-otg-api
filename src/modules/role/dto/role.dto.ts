import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateRoleDto {
  @IsString() @IsOptional() id: string;
  @IsString() name: string;
  @IsString() @IsOptional() permissions: string;
}
