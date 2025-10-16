import * as mongoose from 'mongoose';

export interface EntityChannelStatus extends mongoose.Document {
  user_id: string | mongoose.Schema.Types.ObjectId;
  current_channel: string;
}
