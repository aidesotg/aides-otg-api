import * as mongoose from 'mongoose';

export interface Beneficiary extends mongoose.Document {
  readonly id: string;
  beneficiary_id: string;
  first_name: string;
  last_name: string;
  label: string;
  date_of_birth: Date;
  gender: string;
  relationship: string;
  special_requirements: string[];
  health_conditions: string[];
  profile_picture: string;
  user: string;
  ssn: string;
  emergency_contact: {
    name: string;
    phone: string;
    relationship: string;
  }[];
  show_label: boolean;
  hobbies_interests: string;
  readonly createdAt: Date;
  updatedAt: Date;
}
