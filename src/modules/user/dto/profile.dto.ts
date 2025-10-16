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
import { AddressDto } from './address.dto';

export class EmergencyContactDto {
  @ApiProperty() @IsString() @IsOptional() name?: string;
  @ApiProperty() @IsString() @IsOptional() phone?: string;
  @ApiProperty() @IsString() @IsOptional() relationship?: string;
}

export class CreateProfileDto {
  @ApiProperty() @IsString() first_name: string;
  @ApiProperty() @IsString() last_name: string;
  @ApiProperty() @IsString() date_of_birth: string;
  @ApiProperty() @IsString() gender: string;
  @ApiProperty() @IsString() @IsOptional() profile_picture?: string;
  @ApiProperty() @IsString() @IsOptional() type_of_care?: string;
  @ApiProperty() @IsArray() @IsOptional() special_requirements?: string[];
  @ApiProperty() @IsArray() @IsOptional() health_conditions?: string[];
  @ApiProperty() @IsString() ssn: string;
  // @ApiProperty() @IsString() document_url: string;

  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => AddressDto)
  address: AddressDto;

  @ValidateNested({ each: true })
  @IsOptional()
  @IsArray()
  @Type(() => CreateBeneficiaryDto)
  beneficiaries: CreateBeneficiaryDto[];

  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => InsuranceInfoDto)
  insurance: InsuranceInfoDto;

  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => EmergencyContactDto)
  emergency_contact: EmergencyContactDto;
}

export class UpdateProfileDto {
  @ApiProperty() @IsString() @IsOptional() first_name: string;
  @ApiProperty() @IsString() @IsOptional() last_name: string;
  @ApiProperty() @IsString() @IsOptional() date_of_birth: string;
  @ApiProperty() @IsString() @IsOptional() gender: string;
  @ApiProperty() @IsString() @IsOptional() profile_picture?: string;
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => AddressDto)
  address: AddressDto;
  @ApiProperty() @IsString() @IsOptional() type_of_care?: string;
  @ApiProperty() @IsArray() @IsOptional() special_requirements?: string[];
  @ApiProperty() @IsArray() @IsOptional() health_conditions?: string[];
}

export class UpdatePhoneDto {
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
