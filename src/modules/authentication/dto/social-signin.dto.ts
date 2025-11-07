import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class SocialSignInDto {
  @ApiProperty({
    example: "'google', 'apple'",
  })
  @IsString()
  @IsEnum(['google', 'apple'])
  socialType: string;

  @ApiProperty({ example: '020ijdas0jf0aijdfapoidsf' })
  @IsString()
  accessToken: string;

  @ApiProperty({ example: '020ijdas0jf0aijdfapoidsf' })
  @IsString()
  @IsOptional()
  device_token?: string;

  @ApiProperty({ example: 'ios' })
  @IsString()
  @IsOptional()
  deviceType?: string;

  @ApiProperty({ example: 12345 })
  @IsNumber()
  @IsOptional()
  socialId?: number;
}
