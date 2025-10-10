import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';

class FamilyMembersDto {
  @ApiProperty() @IsString() @IsOptional() name: string;
  @ApiProperty() @IsString() @IsOptional() connection: string;
}
export class CreateProfileDto {
  @ApiProperty() @IsString() @IsOptional() first_name: string;
  @ApiProperty() @IsString() @IsOptional() last_name: string;
  @ApiProperty() @IsString() @IsOptional() phone: string;
  status: boolean;
  address: [
    {
      city: string;
      state: string;
      country: string;
    },
  ];
  @ApiProperty() @IsString() department: string;
  @ApiProperty() @IsString() profilePicture: string;
  @ApiProperty() @IsString() maritalStatus: string;
  @ApiProperty() @IsString() sex: string;
  @ApiProperty() @IsString() occupation: string;

  @ValidateNested({ each: true })
  @IsOptional()
  @IsArray()
  @Type(() => FamilyMembersDto)
  familyMembers: FamilyMembersDto[];
}
