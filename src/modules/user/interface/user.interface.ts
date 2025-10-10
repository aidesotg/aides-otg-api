import * as mongoose from 'mongoose';

export interface User extends mongoose.Document {
  readonly id: string;
  fullname: string;
  email: string;
  phone: string;
  password: string;
  country: string;
  language: string;
  device_token: string[];
  role: string;
  activation_code: string;
  activation_expires_in: Date;
  is_active: boolean;
  isSuspended: boolean;
  isDeleted: boolean;
  notification_counter: number;
  status: boolean;
  address: [
    {
      city: string;
      state: string;
      country: string;
    },
  ];
  profilePicture: string;
  sex: string;
  occupation: string;
  readonly createdAt: Date;
  updatedAt: Date;
}
