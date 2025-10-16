import * as mongoose from 'mongoose';

export interface UserBeneficiary extends mongoose.Document {
  readonly id: string;
  user: string;
  beneficiary: string;
  readonly createdAt: Date;
  updatedAt: Date;
}
