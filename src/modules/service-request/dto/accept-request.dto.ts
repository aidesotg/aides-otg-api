import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsString } from 'class-validator';

export class AcceptRequestDto {
  @ApiProperty()
  @IsEnum(['Accepted', 'Rejected'], {
    message: 'Allowed statuses are: Accepted,Rejected,',
  })
  @IsString()
  status: 'Accepted' | 'Rejected';

  @ApiProperty()
  @IsMongoId()
  day_id: string;
}
