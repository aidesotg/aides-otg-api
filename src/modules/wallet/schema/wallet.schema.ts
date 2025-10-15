import * as mongoose from 'mongoose';
import { Wallet } from '../interface/wallet.interface';

export const WalletSchema = new mongoose.Schema<Wallet>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    ledger_balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'NGN',
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

WalletSchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  return object;
});

WalletSchema.virtual('transactions', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'wallet',
});
