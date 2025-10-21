import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  MinLength,
  Min,
  IsMongoId,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(2, {
    message: 'Service name too short',
  })
  name: string;

  @ApiProperty()
  @IsMongoId()
  category: string;

  @ApiProperty()
  @IsNumber()
  @Min(0, {
    message: 'Price must be greater than or equal to 0',
  })
  price: number;

  @ApiProperty()
  @IsNumber()
  @Min(0, {
    message: 'Care giver commission must be greater than or equal to 0',
  })
  care_giver_commission: number;

  @ApiProperty({ enum: ['active', 'suspended'] })
  @IsEnum(['active', 'suspended'])
  status: 'active' | 'suspended';
}

export class UpdateServiceDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  @MinLength(2, {
    message: 'Service name too short',
  })
  name?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0, {
    message: 'Price must be greater than or equal to 0',
  })
  @IsOptional()
  price?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0, {
    message: 'Care giver commission must be greater than or equal to 0',
  })
  @IsOptional()
  care_giver_commission?: number;

  @ApiProperty({ enum: ['active', 'suspended'] })
  @IsEnum(['active', 'suspended'])
  @IsOptional()
  status?: 'active' | 'suspended';
}
