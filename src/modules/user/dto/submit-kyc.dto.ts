import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsDateString,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AddressDto } from './address.dto';

export class SubmitKycDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  date_of_birth: string;

  //   @ApiProperty({ enum: ['pending', 'approved', 'rejected'] })
  //   @IsEnum(['pending', 'approved', 'rejected'])
  //   @IsNotEmpty()
  //   status: 'pending' | 'approved' | 'rejected';

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  @IsNotEmpty()
  address: AddressDto;

  @ApiProperty({ type: [String] })
  @IsString()
  @IsNotEmpty()
  document_url: string;
}
