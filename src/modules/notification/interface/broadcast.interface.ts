import * as mongoose from 'mongoose';

export interface Broadcast extends mongoose.Document {
  readonly id: string;
  title: string;
  body: string;
  isDraft: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
