import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateInsuranceCompanyDto {
  @ApiProperty() @IsString() company_name: string;
  @ApiProperty() @IsString() logo: string;
  @ApiProperty() @IsString() approval_type: string;
  @ApiProperty() @IsArray() services_covered: string[];
  @ApiProperty() @IsString() status: string;
}
