import * as mongoose from 'mongoose';

export interface Insurance extends mongoose.Document {
  readonly id: string;
  name: string;
  description?: string;
  contact_email: string;
  contact_phone: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zip_code?: string;
  };
  admin_details: {
    fullname: string;
    email: string;
    phone: string;
  };
  covered_services: Array<{
    service_type: 'head' | 'knee' | 'shoulder' | 'foot' | 'general';
    coverage_percentage: number;
    direct_payment: boolean;
  }>;
  integration_type: 'manual' | 'api';
  api_config?: {
    base_url?: string;
    api_key?: string;
    secret_key?: string;
    webhook_url?: string;
  };
  is_active: boolean;
  is_deleted: boolean;
  created_by: string;
  readonly createdAt: Date;
  updatedAt: Date;
}
