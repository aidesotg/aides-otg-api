import * as mongoose from 'mongoose';

export interface Insurance extends mongoose.Document {
  readonly id: string;
  name: string;
  policy_number: string;
  coverage_plan: string;
  coverage_plan_start: Date;
  coverage_plan_date: Date;
  insurance_document: string;
  is_active: boolean;
  is_deleted: boolean;
  user: string;
  beneficiary: string;
  insurance_company: string;
  created_by: string;
  readonly createdAt: Date;
  updatedAt: Date;
}
