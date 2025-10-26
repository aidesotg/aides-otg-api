import { Bank } from '../interface/bank.interface';
import * as mongoose from 'mongoose';

export const BankSchema = new mongoose.Schema<Bank>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bank_name: {
      type: String,
    },
    account_number: {
      type: String,
    },
    account_name: {
      type: String,
    },
    routing_number: {
      type: String,
    },
    default: {
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

export const BankModel = mongoose.model<Bank>('Bank', BankSchema);
