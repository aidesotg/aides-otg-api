/* eslint-disable @typescript-eslint/no-unused-vars */
import * as mongoose from 'mongoose';
import { User } from '../interface/user.interface';

export const UserSchema = new mongoose.Schema<User>(
  {
    fullname: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    country: {
      type: String,
    },
    language: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    device_token: [
      {
        type: String,
      },
    ],
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
    activation_code: {
      type: String,
    },
    activation_expires_in: {
      type: Date,
    },
    is_active: {
      type: Boolean,
      default: false,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    notification_counter: {
      type: Number,
    },
    status: {
      type: Boolean,
    },
    address: [
      {
        city: {
          type: String,
        },
        state: {
          type: String,
        },
        country: {
          type: String,
        },
      },
    ],
    profilePicture: {
      type: String,
    },
    sex: {
      type: String,
    },
    occupation: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

UserSchema.method('toJSON', function () {
  const { __v, password, ...object } = this.toObject();
  const newObject = {
    ...object,
  };
  return newObject;
});

UserSchema.virtual('wallet', {
  ref: 'Wallet',
  localField: '_id',
  foreignField: 'user',
});

UserSchema.virtual('bank', {
  ref: 'Bank',
  localField: '_id',
  foreignField: 'user',
});

UserSchema.virtual('service_profile', {
  ref: 'ServiceProfile',
  localField: '_id',
  foreignField: 'user',
});
