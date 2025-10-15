import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MinLength,
  IsEmail,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CoveredServiceDto {
  @ApiProperty()
  @IsEnum(['head', 'knee', 'shoulder', 'foot', 'general'])
  service_type: 'head' | 'knee' | 'shoulder' | 'foot' | 'general';

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  coverage_percentage: number;

  @ApiProperty()
  @IsBoolean()
  direct_payment: boolean;
}

export class InsuranceInfoDto {
  @ApiProperty() @IsString() @IsOptional() gender?: string;
  @ApiProperty() @IsString() @IsOptional() policy_number?: string;
  @ApiProperty() @IsString() @IsOptional() coverage_plan?: string;
  @ApiProperty() @IsDateString() @IsOptional() coverage_plan_start?: string;
  @ApiProperty() @IsDateString() @IsOptional() coverage_plan_date?: string;
  @ApiProperty() @IsString() @IsOptional() insurance_document?: string;
}
