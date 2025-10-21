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
      log: [
        {
          status: {
            type: String,
          },
          description: {
            type: String,
          },
          completed: {
            type: Boolean,
            default: false,
          },
          created_at: {
            type: Date,
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

ServiceRequestDayLogsSchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  return object;
});
