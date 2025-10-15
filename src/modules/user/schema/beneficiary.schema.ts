/* eslint-disable @typescript-eslint/no-unused-vars */
import * as mongoose from 'mongoose';
import { Beneficiary } from '../interface/beneficiary.interface';

export const BeneficiarySchema = new mongoose.Schema<Beneficiary>(
  {
    first_name: {
      type: String,
    },
    last_name: {
      type: String,
    },
    label: {
      type: String,
      required: true,
      unique: true,
    },
    date_of_birth: {
      type: String,
      required: true,
      unique: true,
    },
    gender: {
      type: String,
    },
    relationship: {
      type: String,
    },
    special_requirements: {
      type: String,
      required: true,
    },
    health_conditions: [
      {
        type: String,
      },
    ],
    profilePicture: {
      type: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
