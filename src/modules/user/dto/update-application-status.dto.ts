import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateApplicationStatusDto {
  @ApiProperty()
  @IsString()
  @IsEnum(['approved', 'rejected'], {
    message: 'Allowed application statuses are: approved, rejected',
  })
  status: 'approved' | 'rejected';
  @ApiProperty() @IsString() @IsOptional() reason: string;
}
