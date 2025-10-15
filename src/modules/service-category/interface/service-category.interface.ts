import * as mongoose from 'mongoose';

export interface ServiceCategory extends mongoose.Document {
  readonly id: string;
  title: string;
  description?: string;
  cover_image?: string;
  is_active: boolean;
  is_deleted: boolean;
  created_by: string;
  readonly createdAt: Date;
  updatedAt: Date;
}
