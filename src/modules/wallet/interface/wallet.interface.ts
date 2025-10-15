import * as mongoose from 'mongoose';

export interface Wallet extends mongoose.Document {
  readonly id: string;
  user: string;
  balance: number;
  ledger_balance: number;
  currency: string;
  is_active: boolean;
  is_deleted: boolean;
  readonly createdAt: Date;
  updatedAt: Date;
}
