import * as mongoose from 'mongoose';

export interface Setting extends mongoose.Document {
  readonly id: string;
  company_name: string;
  registration_id: string;
  company_email: string;
  company_phone: string;
  website: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zip_code: string;
  };
  company_photo: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
