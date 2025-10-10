import * as mongoose from 'mongoose';

export const PasswordResetSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    expiry: {
      type: Date,
    },
    used: {
      type: Boolean,
    },
  },
  { timestamps: true },
);

PasswordResetSchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  const newObject = {
    ...object,
  };

  return newObject;
});
