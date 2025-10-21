import * as mongoose from 'mongoose';
import { InsuranceCompany } from '../interface/insurance-comapny.interface';

export const InsuranceCompanySchema = new mongoose.Schema<InsuranceCompany>(
  {
    insurance_id: {
      typr: String,
    },
    company_name: {
      type: String,
    },
    logo: {
      type: String,
    },
    approval_type: {
      type: String,
    },
    services_covered: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

InsuranceCompanySchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  return object;
});

InsuranceCompanySchema.virtual('total_beneficiaries', {
  ref: 'Beneficiary',
  localField: '_id',
  foreignField: 'insurance_company',
});
