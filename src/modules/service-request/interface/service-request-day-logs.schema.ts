import * as mongoose from 'mongoose';

export interface ServiceRequestDayLogs extends mongoose.Document {
  readonly id: string;
  request: string;
  day_id: string;
  log: {
    status: string;
    description: string;
    completed: boolean;
    created_at: Date;
  }[];
  readonly createdAt: Date;
  updatedAt: Date;
}
