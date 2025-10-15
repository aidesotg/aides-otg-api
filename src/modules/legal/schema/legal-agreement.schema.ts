import * as mongoose from 'mongoose';
import { LegalAgreement } from '../interface/legal-agreement.interface';

export const LegalAgreementSchema = new mongoose.Schema<LegalAgreement>(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LegalDocument',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    version: {
      type: Number,
      required: true,
    },
    agreement_type: {
      type: String,
      enum: ['signature', 'click_to_agree'],
      required: true,
    },
    signature_data: {
      type: String, // Base64 encoded signature image
    },
    ip_address: {
      type: String,
    },
    user_agent: {
      type: String,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

LegalAgreementSchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  return object;
});

// Ensure one agreement per user per document version
LegalAgreementSchema.index(
  { document: 1, user: 1, version: 1 },
  { unique: true },
);
