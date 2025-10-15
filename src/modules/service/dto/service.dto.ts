import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MinLength,
  IsNumber,
  IsEnum,
  Min,
  Max,
} from 'class-validator';

export class CreateServiceDto {
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
  @IsNotEmpty()
  category: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  commission_percentage: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  caregiver_commission: number;

  @ApiProperty()
  @IsNumber()
  @Min(0.5)
  @IsOptional()
  duration_hours?: number;

  @ApiProperty()
  @IsEnum(['head', 'knee', 'shoulder', 'foot', 'general'])
  service_type: 'head' | 'knee' | 'shoulder' | 'foot' | 'general';
}

export class UpdateServiceDto {
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
  category?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  commission_percentage?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsOptional()
  caregiver_commission?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0.5)
  @IsOptional()
  duration_hours?: number;

  @ApiProperty()
  @IsEnum(['head', 'knee', 'shoulder', 'foot', 'general'])
  @IsOptional()
  service_type?: 'head' | 'knee' | 'shoulder' | 'foot' | 'general';

  @ApiProperty()
  @IsOptional()
  is_active?: boolean;
}
