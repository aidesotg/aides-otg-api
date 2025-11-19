import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class MakeCallDto {
  @IsString()
  to: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsEnum(['GET', 'POST'])
  method?: 'GET' | 'POST';

  @IsOptional()
  @IsString()
  statusCallback?: string;

  @IsOptional()
  @IsEnum(['GET', 'POST'])
  statusCallbackMethod?: 'GET' | 'POST';

  @IsOptional()
  @IsBoolean()
  record?: boolean;
}

export class MakeCallWithTwimlDto {
  @IsString()
  to: string;

  @IsString()
  twiml: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  statusCallback?: string;

  @IsOptional()
  @IsEnum(['GET', 'POST'])
  statusCallbackMethod?: 'GET' | 'POST';

  @IsOptional()
  @IsBoolean()
  record?: boolean;
}

export class UpdateCallStatusDto {
  @IsEnum(['canceled', 'completed'])
  status: 'canceled' | 'completed';
}

