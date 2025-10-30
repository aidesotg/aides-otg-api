import * as mongoose from 'mongoose';

export interface Kyc extends mongoose.Document {
  readonly id: string;
  user: string;
  email: string;
  phone: string;
  date_of_birth: string;
  status: 'pending' | 'approved' | 'rejected';
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zip_code: string;
  };
  document_url: string[];
  reason: string;
  readonly createdAt: Date;
  updatedAt: Date;
}
