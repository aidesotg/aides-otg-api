import * as mongoose from 'mongoose';

export interface Transaction extends mongoose.Document {
  readonly id: string;
  user: string;
  email: string;
  fullname: string;
  phone: string;
  trx_id: string;
  tx_ref: string;
  flw_ref: string;
  device_fingerprint: string;
  amount: number;
  charged_amount: number;
  app_fee: number;
  merchant_fee: number;
  processor_response: string;
  auth_model: string;
  currency: string;
  ip: string;
  narration: string;
  status: string;
  auth_url: string;
  payment_type: string;
  plan: string;
  fraud_status: string;
  charge_type: string;
  details: string;
  created_at: Date;
  account_id: string;
  customer: string;
  card: string;
  type: string;
  group: boolean;
  groupId: string;
  readonly createdAt: Date;
  updatedAt: Date;
}
