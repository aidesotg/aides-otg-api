import * as mongoose from 'mongoose';
import { Service } from '../interface/service.interface';

export const ServiceSchema = new mongoose.Schema<Service>(
  {
    name: {
      type: String,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
    },
    price: {
      type: Number,
    },
    care_giver_commission: {
      type: Number,
    },
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

// ServiceRequestSchema.method('toJSON', function () {
//   const { __v, ...object } = this.toObject();
//   return object;
// });
