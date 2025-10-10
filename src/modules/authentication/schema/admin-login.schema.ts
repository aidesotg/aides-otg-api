import * as mongoose from 'mongoose';

export const AdminLoginSchema = new mongoose.Schema(
  {
    userId: {
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
    date: {
      type: Date,
    },
  },
  { timestamps: true },
);

AdminLoginSchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  const newObject = {
    ...object,
  };

  return newObject;
});
