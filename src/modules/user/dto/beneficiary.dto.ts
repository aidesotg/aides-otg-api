import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MinLength,
  IsDateString,
  IsArray,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { InsuranceInfoDto } from 'src/modules/insurance/dto/insurance.dto';
import { EmergencyContactDto } from './profile.dto';

export class CreateBeneficiaryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  first_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  last_name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  label?: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  date_of_birth: string;

  @ApiProperty({ enum: ['male', 'female', 'other'] })
  @IsString()
  @IsIn(['male', 'female', 'other'])
  gender: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  relationship?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  special_requirements?: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  health_conditions?: string[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  profile_picture?: string;

  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => InsuranceInfoDto)
  insurance: InsuranceInfoDto;

  @ApiProperty()
  @IsString()
  ssn: string;
}

export class UpdateBeneficiaryDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  @MinLength(2)
  first_name?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @MinLength(2)
  last_name?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  label?: string;

  @ApiProperty()
  @IsDateString()
  @IsOptional()
  date_of_birth?: string;

  @ApiProperty({ enum: ['male', 'female', 'other'] })
  @IsString()
  @IsOptional()
  @IsIn(['male', 'female', 'other'])
  gender?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  relationship?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  special_requirements?: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  health_conditions?: string[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  profile_picture?: string;

  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => InsuranceInfoDto)
  insurance: InsuranceInfoDto;

  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => EmergencyContactDto)
  emergency_contact: EmergencyContactDto;
}
