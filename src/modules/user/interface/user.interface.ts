import * as mongoose from 'mongoose';

export interface User extends mongoose.Document {
  readonly id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  date_of_birth: string;
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
  profile_picture: string;
  gender: string;
  occupation: string;
  ssn: string;
  emergency_contact: {
    name: string;
    phone: string;
    relationship: string;
  };
  document_url: string;
  readonly createdAt: Date;
  updatedAt: Date;
}
