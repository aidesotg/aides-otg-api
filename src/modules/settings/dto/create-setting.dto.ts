import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AddressDto } from 'src/modules/user/dto/address.dto';

export class CreateSettingDto {
  @ApiProperty() @IsString() company_name: string;
  @ApiProperty() @IsString() registration_id: string;
  @ApiProperty() @IsString() company_email: string;
  @ApiProperty() @IsString() company_phone: string;
  @ApiProperty() @IsString() website: string;
  @ApiProperty() @ValidateNested() @Type(() => AddressDto) address: AddressDto;
  @ApiProperty() @IsString() company_photo: string;
}
