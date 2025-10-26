import * as mongoose from 'mongoose';

export interface ServiceRequest extends mongoose.Document {
  readonly id: string;
  booking_id: string;
  transaction_id: string;
  self_care: boolean;
  created_by: mongoose.Schema.Types.ObjectId;
  beneficiary: mongoose.Schema.Types.ObjectId;
  details: string;
  location: {
    street?: string;
    city: string;
    state: string;
    country: string;
    zip_code?: string;
  };
  care_type: string;
  notes: string;
  duration_type: string;
  date_list: {
    date: Date;
    day_of_week: string;
    start_time: string;
    end_time: string;
  }[];
  care_giver: mongoose.Schema.Types.ObjectId;
  status: string;
  status_history: {
    status: string;
    created_at: Date;
  }[];
  cancellation_reason: string;
  cancellation_note: string;
  readonly createdAt: Date;
  updatedAt: Date;
}
