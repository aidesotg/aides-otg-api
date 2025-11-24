import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumber,
  ValidateNested,
} from 'class-validator';

export class LocationDto {
  @ApiProperty()
  @IsNumber()
  lat: number;

  @ApiProperty()
  @IsNumber()
  lng: number;
}

export class AddressDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  street?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  zip_code?: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  coordinates?: LocationDto;
}
