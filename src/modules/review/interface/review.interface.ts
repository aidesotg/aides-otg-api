import * as mongoose from 'mongoose';

export interface Review extends mongoose.Document {
  readonly id: string;
  reviewer: string;
  caregiver: string;
  booking: string;
  rating: number;
  comment: string;
  is_reported: boolean;
  report_reason?: string;
  report_details?: string;
  reported_by?: string;
  is_suspended: boolean;
  suspended_by?: string;
  suspension_reason?: string;
  is_deleted: boolean;
  readonly createdAt: Date;
  updatedAt: Date;
}
