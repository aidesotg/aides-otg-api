import * as mongoose from 'mongoose';

export interface Patient extends mongoose.Document {
  readonly id: string;
  fullname: string;
  date_of_birth: Date;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zip_code?: string;
  };
  emergency_contact: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  medical_conditions: string[];
  allergies: string[];
  medications: string[];
  insurance?: string;
  insurance_details: {
    policy_number?: string;
    expiry_date?: Date;
    coverage_percentage: number;
    is_verified: boolean;
    verification_date?: Date;
    total_hours_available: number;
    hours_used: number;
  };
  created_by: string;
  is_active: boolean;
  is_deleted: boolean;
  readonly createdAt: Date;
  updatedAt: Date;
}
