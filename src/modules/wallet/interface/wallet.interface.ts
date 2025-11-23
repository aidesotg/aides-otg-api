import * as mongoose from 'mongoose';

export interface Wallet extends mongoose.Document {
  readonly id: string;
  user: string;
  email: string;
  balance: number;
  ledger_balance: number;
  // tokens: number;
  type: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
