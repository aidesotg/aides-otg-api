import * as mongoose from 'mongoose';
import { LegalDocument } from '../interface/legal-document.interface';

export const LegalDocumentSchema = new mongoose.Schema<LegalDocument>(
  {
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    agreement_type: {
      type: String,
      enum: ['signature', 'click_to_agree'],
      required: true,
    },
    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
      },
    ],
    all_roles: {
      type: Boolean,
      default: false,
    },
    version: {
      type: Number,
      default: 1,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parent_document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LegalDocument',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

LegalDocumentSchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  return object;
});

LegalDocumentSchema.virtual('agreements', {
  ref: 'LegalAgreement',
  localField: '_id',
  foreignField: 'document',
});
