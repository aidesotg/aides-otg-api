import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsMongoId, IsNumber } from 'class-validator';

export class AddReviewDto {
  @ApiProperty()
  @IsMongoId()
  @IsNotEmpty()
  request: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  review: string;

  @ApiProperty()
  @IsNumber()
  rating: number;
}
