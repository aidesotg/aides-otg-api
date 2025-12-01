import * as mongoose from 'mongoose';

export interface PoolWalletTransaction extends mongoose.Document {
  readonly id: string;
  type: string;
  description: string;
  user: string;
  amount: number;
  prev_balance: number;
  curr_balance: number;
  confirmed: boolean;
  reference: string;
  genus: string;
  readonly createdAt: Date;
  updatedAt: Date;
}
