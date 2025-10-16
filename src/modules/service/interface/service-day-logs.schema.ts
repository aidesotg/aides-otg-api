import * as mongoose from 'mongoose';

export interface ServiceDayLogs extends mongoose.Document {
  readonly id: string;
  service: string;
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
