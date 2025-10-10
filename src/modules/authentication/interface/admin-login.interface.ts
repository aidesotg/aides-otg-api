import * as mongoose from 'mongoose';

export interface AdminLogin extends mongoose.Document {
  readonly id: string;
  userId: string;
  token: string;
  used: boolean;
  expiry: Date;
  date: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
