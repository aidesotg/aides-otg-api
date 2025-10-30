import * as mongoose from 'mongoose';

export interface Broadcast extends mongoose.Document {
  readonly id: string;
  title: string;
  body: string;
  isDraft: boolean;
  status: string;
  channels: string[];
  audience: string[];
  scheduled_at: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
