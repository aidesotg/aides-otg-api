import * as mongoose from 'mongoose';

export interface Service extends mongoose.Document {
  readonly id: string;
  title: string;
  description?: string;
  category: string;
  price: number;
  commission_percentage: number;
  caregiver_commission: number;
  duration_hours: number;
  is_active: boolean;
  is_deleted: boolean;
  created_by: string;
  service_type: 'head' | 'knee' | 'shoulder' | 'foot' | 'general';
  readonly createdAt: Date;
  updatedAt: Date;
}
