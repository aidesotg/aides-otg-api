import * as mongoose from 'mongoose';
import { Ticket } from '../interface/ticket.interface';

export const TicketSchema = new mongoose.Schema<Ticket>(
  {
    ticket_number: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_review', 'closed'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    category: {
      type: String,
      enum: ['technical', 'billing', 'general', 'complaint', 'dispute'],
      required: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    attachments: [
      {
        filename: String,
        original_name: String,
        file_path: String,
        file_size: Number,
        mime_type: String,
      },
    ],
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

TicketSchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  return object;
});

TicketSchema.virtual('messages', {
  ref: 'TicketMessage',
  localField: '_id',
  foreignField: 'ticket',
});
