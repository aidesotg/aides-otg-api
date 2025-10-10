import * as mongoose from 'mongoose';

export interface Notification extends mongoose.Document {
  readonly id: string;
  user: string;
  title: string;
  message: string;
  type: string;
  isGeneral: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
