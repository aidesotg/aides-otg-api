import * as mongoose from 'mongoose';
import { Service } from '../interface/service.interface';
import { ServiceDayLogs } from '../interface/service-day-logs.schema';

export const ServiceDayLogsSchema = new mongoose.Schema<ServiceDayLogs>(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
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

ServiceDayLogsSchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  return object;
});
