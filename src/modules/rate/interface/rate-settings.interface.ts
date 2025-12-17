import * as mongoose from 'mongoose';

export interface RateSettings extends mongoose.Document {
  readonly id: string;
  platform_commission_percentage: number;
  penalty_settings: {
    client_cancellation: {
      penalty_percentage: number;
      caregiver_benefit_percentage: number;
      max_cancellation_time_hours: number;
    };
    caregiver_cancellation: {
      penalty_amount: number;
      max_cancellation_time_hours: number;
      miss_appointment_penalty_percentage: number;
    };
  };
  suspension_thresholds: {
    caregiver_max_cancellations: number;
    client_max_cancellations: number;
  };
  tax_percentage: number;
  currency: string;
  is_active: boolean;
  is_deleted: boolean;
  created_by: string;
  readonly createdAt: Date;
  updatedAt: Date;
}
