import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsNumber,
  IsEnum,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { AddressDto } from './address.dto';

export class KycDto {
  @ApiProperty()
  @IsString()
  government_id: string;

  @ApiProperty()
  @IsString()
  selfie_with_id: string;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty()
  @IsString()
  reason: string;
}

export class PayoutDto {
  @ApiProperty()
  @IsString()
  bank_name: string;

  @ApiProperty()
  @IsString()
  account_number: string;

  @ApiProperty()
  @IsString()
  account_name: string;

  @ApiProperty()
  @IsString()
  routing_number: string;
}

export class ProfessionalProfileDto {
  @ApiProperty({ enum: ['companion', 'unlicensed', 'licensed'] })
  @IsEnum(['companion', 'unlicensed', 'licensed'])
  caregiver_type: 'companion' | 'unlicensed' | 'licensed';

  @ApiProperty()
  @IsOptional()
  @IsString()
  bio: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  license_url?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  experience: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  specialization: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  care_type_preferences: string[];

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  documents?: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  languages: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiProperty({ type: [AddressDto] })
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  areas_covered: AddressDto[];

  @ApiProperty({ type: KycDto })
  @ValidateNested()
  @Type(() => KycDto)
  kyc: KycDto;

  @ApiProperty({ type: PayoutDto })
  @ValidateNested()
  @Type(() => PayoutDto)
  payout: PayoutDto;
}

export class CreateProfessionalProfileDto {
  @ApiProperty() @IsString() first_name: string;
  @ApiProperty() @IsString() last_name: string;
  @ApiProperty() @IsString() date_of_birth: string;
  @ApiProperty() @IsString() gender: string;
  @ApiProperty() @IsString() @IsOptional() profile_picture?: string;
  @ApiProperty() @IsString() ssn: string;

  @ApiProperty({ type: AddressDto })
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  address: AddressDto;

  @ApiProperty({ type: ProfessionalProfileDto })
  @ValidateNested()
  @Type(() => ProfessionalProfileDto)
  professional_profile: ProfessionalProfileDto;
}

export class UpdateProfessionalProfileDto {
  @ApiProperty({
    enum: ['companion', 'unlicensed', 'licensed'],
    required: false,
  })
  @IsEnum(['companion', 'unlicensed', 'licensed'])
  @IsOptional()
  caregiver_type?: 'companion' | 'unlicensed' | 'licensed';

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  license_url?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  id_url?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  experience?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specialization?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  care_type_preferences?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  documents?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languages?: string[];

  @ApiProperty({ type: [AddressDto], required: false })
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  @IsOptional()
  areas_covered?: AddressDto[];

  @ApiProperty({ type: KycDto, required: false })
  @ValidateNested()
  @Type(() => KycDto)
  @IsOptional()
  kyc?: KycDto;

  @ApiProperty({ type: PayoutDto, required: false })
  @ValidateNested()
  @Type(() => PayoutDto)
  @IsOptional()
  payout?: PayoutDto;
}
