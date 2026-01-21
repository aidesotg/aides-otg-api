import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class AddPermissionDto {
    @ApiProperty() @IsString() user: string;
    @ApiProperty() @IsArray() permissions: string[];
}
