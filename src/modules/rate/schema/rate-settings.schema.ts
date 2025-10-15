import * as mongoose from 'mongoose';
import { RateSettings } from '../interface/rate-settings.interface';

export const RateSettingsSchema = new mongoose.Schema<RateSettings>(
  {
    platform_commission_percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 10,
    },
    penalty_settings: {
      customer_cancellation: {
        penalty_percentage: {
          type: Number,
          min: 0,
          max: 100,
          default: 20,
        },
        caregiver_benefit_percentage: {
          type: Number,
          min: 0,
          max: 100,
          default: 50,
        },
        max_cancellation_time_hours: {
          type: Number,
          min: 1,
          default: 2,
        },
      },
      caregiver_cancellation: {
        penalty_amount: {
          type: Number,
          min: 0,
          default: 1000,
        },
        max_cancellation_time_hours: {
          type: Number,
          min: 1,
          default: 2,
        },
      },
    },
    suspension_thresholds: {
      caregiver_max_cancellations: {
        type: Number,
        min: 1,
        default: 3,
      },
      customer_max_cancellations: {
        type: Number,
        min: 1,
        default: 10,
      },
    },
    currency: {
      type: String,
      default: 'NGN',
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

RateSettingsSchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  return object;
});
