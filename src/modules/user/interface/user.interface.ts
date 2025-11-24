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
  status: 'active' | 'inactive' | 'suspended' | 'deactivated';
  suspension_reason: string;
  isDeleted: boolean;
  notification_counter: number;
  address: {
    street?: string;
    city: string;
    state: string;
    country: string;
    zip_code?: string;
    coordinates?: Record<string, any>;
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
  type_of_care: string[];
  document_url: string;
  special_requirements: string[];
  health_conditions: string[];
  firebase_uid: string;
  docId: string;
  stripeConnect: { stripeCustomerId: string; active: boolean };
  twoFactorEnabled: {
    sms: boolean;
    google_authenticator: boolean;
  };
  twoFactorSecret: string;
  twoFactorPhone: string;
  twoFactorSmsToken: string;
  notification_settings: {
    email: {
      type: Boolean;
      default: true;
    };
    sms: {
      type: Boolean;
      default: true;
    };
    push: {
      type: Boolean;
      default: true;
    };
    session_updates: {
      type: Boolean;
      default: true;
    };
    payment_updates: {
      type: Boolean;
      default: true;
    };
    messages: {
      type: Boolean;
      default: true;
    };
    reminders: {
      type: Boolean;
      default: true;
    };
  };
  last_login: Date;
  readonly createdAt: Date;
  updatedAt: Date;
}
