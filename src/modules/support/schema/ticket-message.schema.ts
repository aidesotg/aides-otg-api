import * as mongoose from 'mongoose';
import { TicketMessage } from '../interface/ticket-message.interface';

export const TicketMessageSchema = new mongoose.Schema<TicketMessage>(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    attachments: [{ type: String }],
    is_internal: {
      type: Boolean,
      default: false,
    },
    is_deleted: {
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

TicketMessageSchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  return object;
});
