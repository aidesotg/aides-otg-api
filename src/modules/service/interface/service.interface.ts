import * as mongoose from 'mongoose';

export interface Service extends mongoose.Document {
  readonly id: string;
  booking_id: string;
  transaction_id: string;
  self_care: boolean;
  created_by: string;
  beneficiary: string;
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
  care_giver: string;
  status: string;
  status_history: {
    status: string;
    created_at: Date;
  }[];
  readonly createdAt: Date;
  updatedAt: Date;
}
