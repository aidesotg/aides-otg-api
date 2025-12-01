import * as mongoose from 'mongoose';

export const PoolWalletTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      default: 'credit',
    },
    description: {
      type: String,
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
    prev_balance: {
      type: Number,
      required: true,
    },
    curr_balance: {
      type: Number,
      required: true,
    },
    confirmed: {
      type: Boolean,
      required: true,
      default: false,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
    },
    genus: {
      type: String,
      required: true,
    },
    group: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

PoolWalletTransactionSchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  const newObject = {
    ...object,
  };

  return newObject;
});
