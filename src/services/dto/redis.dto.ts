import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCaregiverLocationDto {
  @IsString()
  userId: string;

  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @Type(() => Number)
  @IsNumber()
  longitude: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  timestamp?: number;
}

export class FindNearbyCaregiversDto {
  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @Type(() => Number)
  @IsNumber()
  longitude: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  radius?: number;

  @IsOptional()
  @IsEnum(['m', 'km', 'mi', 'ft'])
  unit?: 'm' | 'km' | 'mi' | 'ft';
}

export class GetDistanceBetweenDto {
  @IsString()
  caregiverId1: string;

  @IsString()
  caregiverId2: string;

  @IsOptional()
  @IsEnum(['m', 'km', 'mi', 'ft'])
  unit?: 'm' | 'km' | 'mi' | 'ft';
}

export class OnlineStatusQueryDto {
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  maxAge?: number;
}

export class FindCaregiversNearRequestDto {
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  radius?: number;
}

export class UpdateRequestLocationDto {
  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @Type(() => Number)
  @IsNumber()
  longitude: number;
}

