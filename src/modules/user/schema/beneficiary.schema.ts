/* eslint-disable @typescript-eslint/no-unused-vars */
import * as mongoose from 'mongoose';
import { Beneficiary } from '../interface/beneficiary.interface';
import { unique } from 'faker';

export const BeneficiarySchema = new mongoose.Schema<Beneficiary>(
  {
    beneficiary_id: {
      type: String,
    },
    first_name: {
      type: String,
    },
    last_name: {
      type: String,
    },
    label: {
      type: String,
    },
    date_of_birth: {
      type: String,
    },
    gender: {
      type: String,
    },
    relationship: {
      type: String,
    },
    special_requirements: [
      {
        type: String,
      },
    ],
    health_conditions: [
      {
        type: String,
      },
    ],
    profile_picture: {
      type: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ssn: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

BeneficiarySchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  const newObject = {
    ...object,
  };
  return newObject;
});

BeneficiarySchema.virtual('insurance', {
  ref: 'Insurance',
  localField: '_id',
  foreignField: 'beneficiary',
  justOne: true,
});

BeneficiarySchema.virtual('owner', {
  ref: 'UserBeneficiary',
  localField: '_id',
  foreignField: 'beneficiary',
  justOne: true,
});
