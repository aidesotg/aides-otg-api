import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsBoolean,
  IsNumber,
  IsArray,
  IsIn,
  Min,
  Max,
} from 'class-validator';

export class CreateProfessionalProfileDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bio: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  license_url: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id_url: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  experience: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  specialization?: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  care_type_preferences?: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  certifications?: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  documents?: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  languages?: string[];
}

export class UpdateProfessionalProfileDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  license_url?: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  verified?: boolean;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsOptional()
  experience?: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  skills?: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  certifications?: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  documents?: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  languages?: string[];
}
