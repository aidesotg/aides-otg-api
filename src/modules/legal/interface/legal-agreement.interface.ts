import * as mongoose from 'mongoose';

export interface LegalAgreement extends mongoose.Document {
  readonly id: string;
  document: string;
  user: string;
  version: number;
  agreement_type: 'signature' | 'click_to_agree';
  signature_data?: string;
  ip_address?: string;
  user_agent?: string;
  is_deleted: boolean;
  readonly createdAt: Date;
  updatedAt: Date;
}
