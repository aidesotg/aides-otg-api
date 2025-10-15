import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MinLength,
  IsNumber,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  caregiver: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  booking: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  comment: string;
}

export class UpdateReviewDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @MinLength(10)
  comment?: string;
}

export class ReportReviewDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  report_reason: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  report_details?: string;
}

export class SuspendReviewDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  suspension_reason: string;
}

export class ReviewQueryDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  caregiver?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  reviewer?: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  is_reported?: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  is_suspended?: boolean;
}
