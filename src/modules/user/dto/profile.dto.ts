import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  MinLength,
  MaxLength,
} from 'class-validator';
import { CreateBeneficiaryDto } from './beneficiary.dto';
import { InsuranceInfoDto } from 'src/modules/insurance/dto/insurance.dto';

export class CreateProfileDto {
  @ApiProperty() @IsString() first_name: string;
  @ApiProperty() @IsString() last_name: string;
  @ApiProperty() @IsString() date_of_birth: string;
  @ApiProperty() @IsString() gender: string;
  @ApiProperty() @IsString() @IsOptional() profile_picture?: string;
  @ApiProperty() @IsString() @IsOptional() address?: string;
  @ApiProperty() @IsString() @IsOptional() type_of_care?: string;
  @ApiProperty() @IsArray() @IsOptional() special_requirements?: string[];
  @ApiProperty() @IsArray() @IsOptional() health_conditions?: string[];

  @ValidateNested({ each: true })
  @IsOptional()
  @IsArray()
  @Type(() => CreateBeneficiaryDto)
  beneficiaries: CreateBeneficiaryDto[];

  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => InsuranceInfoDto)
  insurances: InsuranceInfoDto;
}

export class UpdateProfileDto {
  @ApiProperty() @IsString() @IsOptional() first_name: string;
  @ApiProperty() @IsString() @IsOptional() last_name: string;
  @ApiProperty() @IsString() @IsOptional() date_of_birth: string;
  @ApiProperty() @IsString() @IsOptional() gender: string;
  @ApiProperty() @IsString() @IsOptional() profile_picture?: string;
  @ApiProperty() @IsString() @IsOptional() address?: string;
  @ApiProperty() @IsString() @IsOptional() type_of_care?: string;
  @ApiProperty() @IsArray() @IsOptional() special_requirements?: string[];
  @ApiProperty() @IsArray() @IsOptional() health_conditions?: string[];
  @ApiProperty()
  @IsString()
  @IsOptional()
  @MinLength(10, {
    message: 'Phone number too short',
  })
  @MaxLength(10, {
    message: 'Phone number too long',
  })
  phone?: string;
}
