import * as mongoose from 'mongoose';
import { ServiceRequest } from '../interface/service-request-interface.interface';

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
    beneficiary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Beneficiary',
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
    },
    care_type: {
      type: String,
    },
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

      enum: ['Pending', 'Accepted', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Pending',
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
