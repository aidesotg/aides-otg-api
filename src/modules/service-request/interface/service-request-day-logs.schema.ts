import * as mongoose from 'mongoose';

export interface ServiceRequestDayLogs extends mongoose.Document {
  readonly id: string;
  request: string;
  day_id: string;
  status_history: {
    status: string;
    created_at: Date;
  }[];
  activity_trail: {
    on_my_way: boolean;
    arrived: boolean;
    in_progress: boolean;
    completed: boolean;
  };
  care_giver: mongoose.Schema.Types.ObjectId;
  status: string;
  payment: {
    fee_per_hour: number;
    total_service_hours: number;
    caregiver_payout: number;
  };
  payment_status: string;
  call_sids: string[];
  recording_urls: string[];
  readonly createdAt: Date;
  updatedAt: Date;
}
