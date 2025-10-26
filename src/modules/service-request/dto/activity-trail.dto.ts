import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';

export class UpdateActivityTrailDto {
  @ApiProperty()
  @IsEnum(['on_my_way', 'arrived', 'in_progress', 'completed'], {
    message: 'Allowed statuses are: on_my_way, arrived, in_progress, completed',
  })
  @IsString()
  status: 'on_my_way' | 'arrived' | 'in_progress' | 'completed';

  @ApiProperty()
  @IsMongoId()
  day_id: string;
}
