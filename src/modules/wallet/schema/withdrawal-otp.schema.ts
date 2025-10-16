/* eslint-disable @typescript-eslint/no-unused-vars */
import * as mongoose from 'mongoose';

export const WithdrawalOtpSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    details: {
      type: String,
    },
    otp: {
      type: String,
    },
    expiry: {
      type: Date,
    },
    used: {
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

WithdrawalOtpSchema.method('toJSON', function () {
  const { __v, id, ...object } = this.toObject();
  const newObject = {
    ...object,
  };

  return newObject;
});
