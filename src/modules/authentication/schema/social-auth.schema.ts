import * as mongoose from 'mongoose';
import { SocialAuthToken } from '../interface/social-auth.interface';

export const SocialAuthTokenSchema = new mongoose.Schema<SocialAuthToken>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    social: {
      type: String,
      enum: ['facebook', 'google', 'twitter', 'apple'],
    },
    access_token: {
      type: String,
    },

    refresh_token: {
      type: String,
    },

    is_active: {
      type: Boolean,
      default: true,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

SocialAuthTokenSchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  const newObject = {
    ...object,
  };

  return newObject;
});
