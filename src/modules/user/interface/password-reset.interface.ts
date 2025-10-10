import * as mongoose from 'mongoose';

export interface PasswordReset extends mongoose.Document {
  readonly id: string;
  email: string;
  token: string;
  used: boolean;
  expiry: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
