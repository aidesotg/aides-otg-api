/* eslint-disable @typescript-eslint/no-unused-vars */
import * as mongoose from 'mongoose';
import { User } from '../interface/user.interface';

export const UserSchema = new mongoose.Schema<User>(
  {
    first_name: {
      type: String,
    },
    last_name: {
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
    password: {
      type: String,
      required: true,
    },
    date_of_birth: {
      type: String,
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
    address: {
      street: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      country: {
        type: String,
      },
      zip_code: {
        type: String,
      },
    },
    profile_picture: {
      type: String,
    },
    gender: {
      type: String,
    },
    ssn: {
      type: String,
    },
    emergency_contact: {
      name: {
        type: String,
      },
      phone: {
        type: String,
      },
      relationship: {
        type: String,
      },
    },
    document_url: {
      type: String,
    },
    special_requirements: [
      {
        type: String,
      },
    ],
    health_conditions: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

UserSchema.method('toJSON', function () {
  const { __v, password, device_token, ...object } = this.toObject();
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
