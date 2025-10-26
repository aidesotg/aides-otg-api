import * as mongoose from 'mongoose';

export interface Bank extends mongoose.Document {
  readonly id: string;
  user: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  routing_number: string;
  account_type: string;
  default: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
