import * as mongoose from 'mongoose';
import { Transaction } from '../interface/transaction.interface';

export const TransactionSchema = new mongoose.Schema<Transaction>(
  {
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: true,
    },
    category: {
      type: String,
      enum: [
        'deposit',
        'withdrawal',
        'payment',
        'refund',
        'commission',
        'penalty',
        'service_fee',
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    reference: {
      type: String,
      unique: true,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    payment_method: {
      type: String,
      enum: ['card', 'bank_transfer', 'wallet', 'flutterwave', 'stripe'],
    },
    payment_reference: {
      type: String,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    insurance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Insurance',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    processed_at: {
      type: Date,
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

TransactionSchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  return object;
});
