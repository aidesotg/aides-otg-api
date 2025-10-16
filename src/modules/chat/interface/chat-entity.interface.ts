import * as mongoose from 'mongoose';

export interface ChatEntity extends mongoose.Document {
  user_id: string;
  firebase_uid: string;
  full_name: string;
  profile_picture: string;
  unread: number;
}
