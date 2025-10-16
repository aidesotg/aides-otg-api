import * as mongoose from 'mongoose';

export interface WithdrawalOtp extends mongoose.Document {
  readonly id: string;
  user: string;
  details: string;
  otp: string;
  expiry: Date;
  used: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
