import * as mongoose from 'mongoose';
import { ServiceRequestDayLogs } from '../interface/service-request-day-logs.schema';

export const ServiceRequestDayLogsSchema =
  new mongoose.Schema<ServiceRequestDayLogs>(
    {
      request: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceRequest',
      },
      day_id: {
        type: mongoose.Schema.Types.ObjectId,
      },
      activity_trail: {
        on_my_way: {
          type: Boolean,
          default: false,
        },
        arrived: {
          type: Boolean,
          default: false,
        },
        in_progress: {
          type: Boolean,
          default: false,
        },
        completed: {
          type: Boolean,
          default: false,
        },
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
      payment: {
        fee_per_hour: { type: Number },
        total_service_hours: { type: Number },
        caregiver_payout: { type: Number },
      },
      payment_status: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending',
      },
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    },
  );

ServiceRequestDayLogsSchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  return object;
});
