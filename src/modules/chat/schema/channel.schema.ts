import * as mongoose from 'mongoose';
import { ChannelMessageSchema } from './channel-messages.schema';
import { ChatEntitySchema } from './chat-entity.schema';

export const ChannelSchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
    },
    initiator: {
      type: ChatEntitySchema,
    },
    receiver: {
      type: ChatEntitySchema,
    },
    last_message: {
      type: ChannelMessageSchema,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

ChannelSchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  const newObject = {
    ...object,
  };
  return newObject;
});
