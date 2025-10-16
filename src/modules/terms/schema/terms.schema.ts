/* eslint-disable @typescript-eslint/no-unused-vars */
import * as mongoose from 'mongoose';
import { Terms } from '../interface/terms.interface';

export const TermsSchema = new mongoose.Schema<Terms>(
  {
    content: {
      type: String,
    },
    type: {
      type: String,
      default: '',
    },
  },
  { timestamps: true },
);

TermsSchema.method('toJSON', function () {
  const { __v, id, ...object } = this.toObject();
  const newObject = {
    ...object,
  };
  return newObject;
});
