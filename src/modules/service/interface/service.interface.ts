import * as mongoose from 'mongoose';

export interface Service extends mongoose.Document {
  readonly id: string;
  name: string;
  category: string;
  price: number;
  care_giver_commission: number;
  status: 'active' | 'suspended';
  readonly createdAt: Date;
  updatedAt: Date;
}
