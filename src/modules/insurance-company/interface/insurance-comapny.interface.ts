import * as mongoose from 'mongoose';

export interface InsuranceCompany extends mongoose.Document {
  readonly id: string;
  insurance_id: string;
  company_name: string;
  logo: string;
  approval_type: string;
  services_covered: string[];
  status: string;
  readonly createdAt: Date;
  updatedAt: Date;
}
