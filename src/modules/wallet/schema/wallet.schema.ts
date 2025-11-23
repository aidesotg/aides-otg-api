import * as mongoose from 'mongoose';

export const WalletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    email: {
      type: String,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    ledger_balance: {
      type: Number,
      default: 0,
    },
    // tokens: {
    //   type: Number,
    //   default: 0,
    // },
    type: {
      type: String,
      enum: ['organization', 'charity', 'individual'],
      default: 'individual',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

WalletSchema.method('toJSON', function () {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { __v, ...object } = this.toObject();
  const newObject = {
    ...object,
  };

  return newObject;
});
