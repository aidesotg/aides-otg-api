import * as mongoose from 'mongoose';

export interface ServiceRequest extends mongoose.Document {
  readonly id: string;
  booking_id: string;
  transaction_id: string;
  self_care: boolean;
  created_by: mongoose.Schema.Types.ObjectId;
  recepient_type: string;
  beneficiary: mongoose.Schema.Types.ObjectId;
  details: string;
  insurance_company: mongoose.Schema.Types.ObjectId;
  location: {
    street?: string;
    city: string;
    state: string;
    country: string;
    zip_code?: string;
    coordinates?: Record<string, any>;
  };
  care_type: string[];
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
  payments: {
    total: number;
    user_covered_payments: number;
    inurance_covered_payments: number;
    claimed_insurance_payment: number;
    total_service_hours: number;
    fee_per_hour: number;
    platform_commission: number;
    caregiver_payout: number;
    tax: number;
  };
  admin_first_day_reminder_sent: boolean;
  payment_method: 'client' | 'insurance' | 'both';
  payment_status: 'pending' | 'paid' | 'failed' | 'partially_paid';
  readonly createdAt: Date;
  updatedAt: Date;
}
