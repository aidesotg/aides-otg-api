import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MinLength,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
  IsMongoId,
  IsDateString,
  IsNumber,
} from 'class-validator';

export class LocationDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  street?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  zip_code?: string;
}

export class DateSlotDto {
  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  start_time: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  end_time: string;
}

export class CreateServiceRequestDto {
  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  self_care: boolean;

  @ApiProperty()
  @IsMongoId()
  @IsOptional()
  beneficiary?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  details: string;

  @ApiProperty({ type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsNotEmpty()
  location: LocationDto;

  @ApiProperty()
  @IsNotEmpty()
  care_type: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  notes: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  duration_type: string;

  @ApiProperty({ type: [DateSlotDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DateSlotDto)
  @IsNotEmpty()
  date_list: DateSlotDto[];

  @ApiProperty({ required: false })
  @IsMongoId()
  @IsOptional()
  care_giver?: string;
}

export class UpdateServiceRequestDto {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  self_care?: boolean;

  @ApiProperty({ required: false })
  @IsMongoId()
  @IsOptional()
  beneficiary?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MinLength(10)
  details?: string;

  @ApiProperty({ type: LocationDto, required: false })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;

  @ApiProperty({ required: false })
  @IsArray()
  @IsOptional()
  care_type?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  duration_type?: string;

  @ApiProperty({ type: [DateSlotDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DateSlotDto)
  @IsOptional()
  date_list?: DateSlotDto[];

  @ApiProperty({ required: false })
  @IsMongoId()
  @IsOptional()
  care_giver?: string;

  @ApiProperty({
    enum: ['Pending', 'Accepted', 'In Progress', 'Completed', 'Cancelled'],
    required: false,
  })
  @IsEnum(['Pending', 'Accepted', 'In Progress', 'Completed', 'Cancelled'])
  @IsOptional()
  status?: string;
}

export class UpdateLocationDto {
  @ApiProperty()
  @IsNotEmpty()
  latitude: number;

  @ApiProperty()
  @IsNotEmpty()
  longitude: number;
}

export class NearbyCaregiversQueryDto {
  @ApiProperty({ required: false, default: 5 })
  @IsOptional()
  radius?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  latitude?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  longitude?: number;
}
