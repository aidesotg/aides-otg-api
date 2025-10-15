import * as mongoose from 'mongoose';
import { Service } from '../interface/service.interface';

export const ServiceSchema = new mongoose.Schema<Service>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    commission_percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    caregiver_commission: {
      type: Number,
      required: true,
    },
    duration_hours: {
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
    service_type: {
      type: String,
      enum: ['head', 'knee', 'shoulder', 'foot', 'general'],
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

ServiceSchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  return object;
});

ServiceSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'service',
});
