import * as mongoose from 'mongoose';

export interface Faq extends mongoose.Document {
  readonly id: string;
  question: string;
  answer: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
