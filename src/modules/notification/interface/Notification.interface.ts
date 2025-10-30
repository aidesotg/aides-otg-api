import * as mongoose from 'mongoose';

export interface Notification extends mongoose.Document {
  readonly id: string;
  user: string;
  title: string;
  message: string;
  type: string;
  resource: string;
  resource_id: string;
  isGeneral: boolean;
  read: boolean;
  mode: 'client' | 'admin' | 'caregiver';
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
