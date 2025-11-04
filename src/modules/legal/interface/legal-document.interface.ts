import * as mongoose from 'mongoose';

export interface LegalDocument extends mongoose.Document {
  readonly id: string;
  title: string;
  body: string;
  agreement_type: 'signature' | 'click_to_agree';
  roles: string[];
  version: number;
  is_active: boolean;
  is_deleted: boolean;
  created_by: string;
  parent_document: string;
  readonly createdAt: Date;
  updatedAt: Date;
}
