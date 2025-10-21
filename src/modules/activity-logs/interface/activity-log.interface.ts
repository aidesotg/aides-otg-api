import * as mongoose from 'mongoose';

export interface ActivityLog extends mongoose.Document {
  readonly id: string;
  user: string;
  action: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}
