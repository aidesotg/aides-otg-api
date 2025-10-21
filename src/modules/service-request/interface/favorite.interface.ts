import * as mongoose from 'mongoose';

export interface Favorite extends mongoose.Document {
  readonly id: string;
  user: mongoose.Schema.Types.ObjectId;
  request: mongoose.Schema.Types.ObjectId;
  care_giver: mongoose.Schema.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}
