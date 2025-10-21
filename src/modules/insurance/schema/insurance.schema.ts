import * as mongoose from 'mongoose';
import { Insurance } from '../interface/insurance.interface';

export const InsuranceSchema = new mongoose.Schema<Insurance>(
  {
    name: {
      type: String,
    },
    policy_number: {
      type: String,
    },
    coverage_plan: {
      type: String,
    },
    coverage_plan_start: {
      type: Date,
    },
    coverage_plan_date: {
      type: Date,
    },
    insurance_document: {
      type: String,
    },

    is_active: {
      type: Boolean,
      default: true,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    beneficiary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Beneficiary',
    },
    insurance_company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InsuranceCompany',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

InsuranceSchema.method('toJSON', function () {
  const { __v, api_config, ...object } = this.toObject();
  return object;
});

InsuranceSchema.virtual('transactions', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'insurance',
});

InsuranceSchema.virtual('patients', {
  ref: 'Patient',
  localField: '_id',
  foreignField: 'insurance',
});
