import * as mongoose from 'mongoose';
import { ServiceRequest } from '../interface/service-request.interface';

export const ServiceRequestSchema = new mongoose.Schema<ServiceRequest>(
  {
    booking_id: {
      type: String,
    },
    transaction_id: {
      type: String,
    },
    self_care: {
      type: Boolean,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    recepient_type: {
      type: String,
      enum: ['Beneficiary', 'User'],
      default: 'Beneficiary',
    },
    beneficiary: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'recepient_type',
    },
    details: {
      type: String,
    },
    location: {
      street: {
        type: String,
        required: false,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      country: {
        type: String,
      },
      zip_code: {
        type: String,
        required: false,
      },
      coordinates: {},
    },
    care_type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
      },
    ],
    notes: {
      type: String,
    },
    duration_type: {
      type: String,
    },
    date_list: [
      {
        date: {
          type: Date,
        },
        day_of_week: {
          type: String,
        },
        start_time: {
          type: String,
        },
        end_time: {
          type: String,
        },
      },
    ],
    care_giver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: [
        'Pending',
        'Accepted',
        'In Progress',
        'Completed',
        'Cancelled',
        'Rejected',
        'Expired',
      ],
      default: 'Pending',
    },
    cancellation_reason: {
      type: String,
      required: false,
    },
    cancellation_note: {
      type: String,
      required: false,
    },
    status_history: [
      {
        status: {
          type: String,
        },
        created_at: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    payments: {
      total: { type: Number },
      user_covered_payments: { type: Number },
      inurance_covered_payments: { type: Number },
      claimed_insurance_payment: { type: Number },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

ServiceRequestSchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  return object;
});

ServiceRequestSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'service',
});
