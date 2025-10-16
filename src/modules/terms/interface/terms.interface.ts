import * as mongoose from 'mongoose';

export interface Terms extends mongoose.Document {
  readonly id: string;
  content: string;
  type: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
