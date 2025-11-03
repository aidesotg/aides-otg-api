import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MinLength,
  IsEnum,
  IsArray,
  IsNumber,
  Min,
  IsBoolean,
  IsMongoId,
} from 'class-validator';

export class CreateLegalDocumentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty()
  @IsEnum(['signature', 'click_to_agree'])
  agreement_type: 'signature' | 'click_to_agree';

  @ApiProperty()
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  roles?: string[];

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  all_roles?: boolean;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  @Min(1)
  version?: number;
}

export class UpdateLegalDocumentDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  @MinLength(5)
  title?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @MinLength(50)
  body?: string;

  @ApiProperty()
  @IsEnum(['signature', 'click_to_agree'])
  @IsOptional()
  agreement_type?: 'signature' | 'click_to_agree';

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  roles?: string[];

  @ApiProperty()
  @IsOptional()
  is_active?: boolean;
}

export class SignAgreementDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  document_id: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  signature_data?: string; // For signature type agreements

  @ApiProperty()
  @IsString()
  @IsOptional()
  ip_address?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  user_agent?: string;
}

export class LegalDocumentQueryDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  agreement_type?: 'signature' | 'click_to_agree';

  @ApiProperty()
  @IsString()
  @IsOptional()
  role?: string;

  @ApiProperty()
  @IsOptional()
  is_active?: boolean;
}
