import * as mongoose from 'mongoose';

export interface ServiceCategory extends mongoose.Document {
  readonly id: string;
  title: string;
  status: string;
  is_deleted: boolean;
  created_by: string;
  readonly createdAt: Date;
  updatedAt: Date;
}
