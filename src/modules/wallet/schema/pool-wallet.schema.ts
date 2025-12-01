import * as mongoose from 'mongoose';

export const PoolWalletSchema = new mongoose.Schema(
  {
    balance: {
      type: Number,
      default: 0,
    },
    ledger_balance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

PoolWalletSchema.method('toJSON', function () {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { __v, ...object } = this.toObject();
  const newObject = {
    ...object,
  };

  return newObject;
});
