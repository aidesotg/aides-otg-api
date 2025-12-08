import * as mongoose from 'mongoose';

export const SessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    browser: {
      type: String,
    },
    device: {
      type: String,
    },
    location: {
      type: String,
    },
    ip_address: {
      type: String,
    },
    last_login: {
      type: Date,
    },
    jwt_token: {
      type: String,
    },
  },
  { timestamps: true },
);

SessionSchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  const newObject = {
    ...object,
  };

  return newObject;
});
