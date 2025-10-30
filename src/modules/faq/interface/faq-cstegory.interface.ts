import * as mongoose from 'mongoose';

export interface FaqCategory extends mongoose.Document {
  readonly id: string;
  name: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
