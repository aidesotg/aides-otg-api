import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, MinLength } from 'class-validator';

export class CreateServiceCategoryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(2, {
    message: 'Title too short',
  })
  title: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  cover_image?: string;
}

export class UpdateServiceCategoryDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  @MinLength(2, {
    message: 'Title too short',
  })
  title?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  cover_image?: string;

  @ApiProperty()
  @IsOptional()
  is_active?: boolean;
}
