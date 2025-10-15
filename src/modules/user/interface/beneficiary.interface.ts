import * as mongoose from 'mongoose';

export interface Beneficiary extends mongoose.Document {
  readonly id: string;
  first_name: string;
  last_name: string;
  label: string;
  date_of_birth: Date;
  gender: string;
  relationship: string;
  special_requirements: string[];
  health_conditions: string[];
  profilePicture: string;
  user: string;
  readonly createdAt: Date;
  updatedAt: Date;
}
