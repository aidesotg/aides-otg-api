import * as mongoose from 'mongoose';

export interface User extends mongoose.Document {
  readonly id: string;
  client_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  date_of_birth: string;
  device_token: string[];
  roles: string[];
  activation_code: string;
  activation_expires_in: Date;
  status: 'active' | 'inactive' | 'suspended';
  isDeleted: boolean;
  notification_counter: number;
  address: {
    street?: string;
    city: string;
    state: string;
    country: string;
    zip_code?: string;
  };

  profile_picture: string;
  gender: string;
  occupation: string;
  ssn: string;
  emergency_contact: {
    name: string;
    phone: string;
    relationship: string;
  }[];

  document_url: string;
  special_requirements: string[];
  health_conditions: string[];
  firebase_uid: string;
  docId: string;
  stripeConnect: { stripeCustomerId: string; active: boolean };
  readonly createdAt: Date;
  updatedAt: Date;
}
