import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CustomerCancellationSettingsDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  penalty_percentage: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  caregiver_benefit_percentage: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  max_cancellation_time_hours: number;
}

export class CaregiverCancellationSettingsDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  penalty_percentage: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  max_cancellation_time_hours: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  miss_appointment_penalty_percentage: number;
}

export class PenaltySettingsDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => CustomerCancellationSettingsDto)
  client_cancellation: CustomerCancellationSettingsDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => CaregiverCancellationSettingsDto)
  caregiver_cancellation: CaregiverCancellationSettingsDto;
}

export class SuspensionThresholdsDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  caregiver_max_cancellations: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  client_max_cancellations: number;
}

export class CreateRateSettingsDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  platform_commission_percentage: number;

  @ApiProperty()
  @ValidateNested()
  @Type(() => PenaltySettingsDto)
  penalty_settings: PenaltySettingsDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => SuspensionThresholdsDto)
  suspension_thresholds: SuspensionThresholdsDto;

  @ApiProperty()
  @IsString()
  @IsOptional()
  currency?: string;
}

export class UpdateRateSettingsDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  platform_commission_percentage?: number;

  @ApiProperty()
  @ValidateNested()
  @Type(() => PenaltySettingsDto)
  @IsOptional()
  penalty_settings?: PenaltySettingsDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => SuspensionThresholdsDto)
  @IsOptional()
  suspension_thresholds?: SuspensionThresholdsDto;

  @ApiProperty()
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  tax_percentage?: number;

  @ApiProperty()
  @IsOptional()
  is_active?: boolean;
}
