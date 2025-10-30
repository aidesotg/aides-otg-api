/* eslint-disable @typescript-eslint/no-unused-vars */
import * as mongoose from 'mongoose';
import { User } from '../interface/user.interface';

export const UserSchema = new mongoose.Schema<User>(
  {
    client_id: {
      type: String,
    },
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
    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: true,
      },
    ],
    activation_code: {
      type: String,
    },
    activation_expires_in: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    notification_counter: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'deactivated'],
      default: 'inactive',
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
    emergency_contact: [
      {
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
    ],

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
    firebase_uid: {
      type: String,
      default: null,
    },
    docId: {
      type: String,
      default: null,
    },
    stripeConnect: {
      stripeCustomerId: {
        type: String,
        default: null,
      },
      active: {
        type: Boolean,
        default: false,
      },
      last_login: {
        type: Date,
        default: null,
      },
    },
    suspension_reason: {
      type: String,
    },
    twoFactorEnabled: {
      sms: {
        type: Boolean,
        default: false,
      },
      google_authenticator: {
        type: Boolean,
        default: false,
      },
    },
    twoFactorSecret: {
      type: String,
    },
    twoFactorSmsToken: {
      type: String,
      default: null,
    },
    twoFactorPhone: {
      type: String,
      default: null,
    },
    notification_settings: {
      email: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: true,
      },
      session_updates: {
        type: Boolean,
        default: true,
      },
      payment_updates: {
        type: Boolean,
        default: true,
      },
      messages: {
        type: Boolean,
        default: true,
      },
      reminders: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

UserSchema.method('toJSON', function () {
  const {
    __v,
    password,
    device_token,
    firebase_uid,
    stripeConnect,
    docId,
    ssn,
    twoFactorSecret,
    twoFactorSmsToken,
    activation_code,
    activation_expires_in,
    ...object
  } = this.toObject();
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

UserSchema.virtual('professional_profile', {
  ref: 'ProfessionalProfile',
  localField: '_id',
  foreignField: 'user',
  match: { status: 'approved' },
  justOne: true,
});

UserSchema.virtual('has_applied', {
  ref: 'ProfessionalProfile',
  localField: '_id',
  foreignField: 'user',
  count: true,
});
