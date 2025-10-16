import * as mongoose from 'mongoose';
import { ChatEntity } from './chat-entity.interface';

export interface ChannelMessage extends mongoose.Document {
  readonly id: string;
  channel: string;
  shop: string;
  sender: ChatEntity;
  type: string;
  message: string;
  is_deleted_initiator: boolean;
  is_deleted_receiver: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
