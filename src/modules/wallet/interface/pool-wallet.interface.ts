import * as mongoose from 'mongoose';

export interface PoolWallet extends mongoose.Document {
  readonly id: string;
  balance: number;
  ledger_balance: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
