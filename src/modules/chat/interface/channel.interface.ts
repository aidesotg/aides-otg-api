import * as mongoose from 'mongoose';
import { ChannelMessage } from './channel-message.interface';
import { ChatEntity } from './chat-entity.interface';

export interface Channel extends mongoose.Document {
  readonly id: string;
  service: string;
  initiator: ChatEntity;
  receiver: ChatEntity;
  last_message: ChannelMessage;
  active: boolean;

  readonly createdAt: Date;
  readonly updatedAt: Date;
}
