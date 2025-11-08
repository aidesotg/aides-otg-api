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
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AddressDto } from 'src/modules/user/dto/address.dto';

// export class AddressDto {
//   @ApiProperty()
//   @IsString()
//   @IsOptional()
//   street?: string;

//   @ApiProperty()
//   @IsString()
//   @IsOptional()
//   city?: string;

//   @ApiProperty()
//   @IsString()
//   @IsOptional()
//   state?: string;

//   @ApiProperty()
//   @IsString()
//   @IsOptional()
//   country?: string;

//   @ApiProperty()
//   @IsString()
//   @IsOptional()
//   zip_code?: string;
// }

export class EmergencyContactDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  relationship?: string;
}

export class InsuranceDetailsDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  policy_number?: string;

  @ApiProperty()
  @IsDateString()
  @IsOptional()
  expiry_date?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  coverage_percentage?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsOptional()
  total_hours_available?: number;

  @ApiProperty()
  @IsDateString()
  @IsOptional()
  verification_date?: string;
}

export class CreatePatientDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  fullname: string;

  @ApiProperty()
  @IsDateString()
  date_of_birth: string;

  @ApiProperty()
  @IsEnum(['male', 'female', 'other'])
  gender: 'male' | 'female' | 'other';

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  address?: AddressDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  @IsOptional()
  emergency_contact?: EmergencyContactDto;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  medical_conditions?: string[];

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergies?: string[];

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  medications?: string[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  insurance?: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => InsuranceDetailsDto)
  @IsOptional()
  insurance_details?: InsuranceDetailsDto;
}

export class UpdatePatientDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  @MinLength(2)
  fullname?: string;

  @ApiProperty()
  @IsDateString()
  @IsOptional()
  date_of_birth?: string;

  @ApiProperty()
  @IsEnum(['male', 'female', 'other'])
  @IsOptional()
  gender?: 'male' | 'female' | 'other';

  @ApiProperty()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  address?: AddressDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  @IsOptional()
  emergency_contact?: EmergencyContactDto;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  medical_conditions?: string[];

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergies?: string[];

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  medications?: string[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  insurance?: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => InsuranceDetailsDto)
  @IsOptional()
  insurance_details?: InsuranceDetailsDto;

  @ApiProperty()
  @IsOptional()
  is_active?: boolean;
}
