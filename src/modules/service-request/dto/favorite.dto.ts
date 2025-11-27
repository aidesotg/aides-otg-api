import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsMongoId, IsOptional } from 'class-validator';

export class AddFavoriteDto {
  @ApiProperty()
  @IsMongoId()
  @IsOptional()
  request: string;

  @ApiProperty()
  @IsMongoId()
  @IsNotEmpty()
  care_giver: string;
}
