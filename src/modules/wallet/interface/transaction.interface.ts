import * as mongoose from 'mongoose';

export interface Transaction extends mongoose.Document {
  readonly id: string;
  wallet: string;
  user: string;
  amount: number;
  type: 'credit' | 'debit';
  category:
    | 'deposit'
    | 'withdrawal'
    | 'payment'
    | 'refund'
    | 'commission'
    | 'penalty'
    | 'service_fee';
  description: string;
  reference: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  payment_method?:
    | 'card'
    | 'bank_transfer'
    | 'wallet'
    | 'flutterwave'
    | 'stripe';
  payment_reference?: string;
  booking?: string;
  insurance?: string;
  metadata?: any;
  processed_at?: Date;
  is_deleted: boolean;
  readonly createdAt: Date;
  updatedAt: Date;
}
