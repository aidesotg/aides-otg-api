import * as mongoose from 'mongoose';

export interface Review extends mongoose.Document {
  readonly id: string;
  user: mongoose.Schema.Types.ObjectId;
  request: mongoose.Schema.Types.ObjectId;
  care_giver: mongoose.Schema.Types.ObjectId;
  rating: number;
  review: string;
  created_at: Date;
  updated_at: Date;
}
