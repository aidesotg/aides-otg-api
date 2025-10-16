import * as mongoose from 'mongoose';
import { ChatEntitySchema } from './chat-entity.schema';

export const ChannelMessageSchema = new mongoose.Schema(
  {
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel',
      required: true,
    },
    sender: {
      type: ChatEntitySchema,
    },
    type: {
      type: String,
    },
    message: {
      type: String,
    },
    is_deleted_initiator: {
      type: Boolean,
      default: false,
    },
    is_deleted_receiver: {
      type: Boolean,
      default: false,
    },
  },

  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

ChannelMessageSchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  const newObject = {
    ...object,
  };
  return newObject;
});
