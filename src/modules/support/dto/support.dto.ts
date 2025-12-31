import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MinLength,
  IsEnum,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsMongoId,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AttachmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  original_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  file_path: string;

  @ApiProperty()
  file_size: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  mime_type: string;
}

export class CreateTicketDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  subject: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  // @IsEnum(['technical', 'billing', 'general', 'complaint', 'dispute', 'other'])
  category: string;

  @ApiProperty()
  @IsEnum(['low', 'medium', 'high'])
  @IsOptional()
  priority?: 'low' | 'medium' | 'high';

  @ApiProperty()
  @IsArray()
  @IsOptional()
  attachments?: string[];

  @ApiProperty()
  @IsMongoId()
  @IsOptional()
  user_type?: string;

  @ApiProperty()
  @IsMongoId()
  @IsOptional()
  user?: string;

  @ApiProperty()
  @IsMongoId()
  @IsOptional()
  against?: string;

  @ApiProperty()
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class UpdateTicketDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  @MinLength(5)
  title?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @MinLength(10)
  description?: string;

  @ApiProperty()
  @IsEnum(['technical', 'billing', 'general', 'complaint', 'dispute'])
  @IsOptional()
  category?: 'technical' | 'billing' | 'general' | 'complaint' | 'dispute';

  @ApiProperty()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  @IsOptional()
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  @ApiProperty()
  @IsArray()
  @IsOptional()
  attachments?: string[];

  // @ApiProperty()
  // @IsEnum(['open', 'in_review', 'closed'])
  // @IsOptional()
  // status?: 'open' | 'in_review' | 'closed';

  // @ApiProperty()
  // @IsString()
  // @IsOptional()
  // assigned_to?: string;
}

export class CreateTicketMessageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  message: string;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  attachments?: string[];

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  is_internal?: boolean;
}

export class TicketQueryDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  status?: 'open' | 'in_review' | 'closed';

  @ApiProperty()
  @IsString()
  @IsOptional()
  category?:
    | 'technical'
    | 'billing'
    | 'general'
    | 'complaint'
    | 'dispute'
    | 'other';

  @ApiProperty()
  @IsString()
  @IsOptional()
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  @ApiProperty()
  @IsString()
  @IsOptional()
  assigned_to?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  start_date?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  end_date?: string;
}
