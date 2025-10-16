import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';

export class AddFavoriteDto {
  @ApiProperty()
  @IsMongoId()
  @IsNotEmpty()
  service: string;

  @ApiProperty()
  @IsMongoId()
  @IsNotEmpty()
  care_giver: string;
}
