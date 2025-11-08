import * as mongoose from 'mongoose';
import { Ticket } from '../interface/ticket.interface';

export const TicketSchema = new mongoose.Schema<Ticket>(
  {
    ticket_number: {
      type: String,
      required: true,
      unique: true,
    },
    subject: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'open', 'in_review', 'closed'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    category: {
      type: String,
      // enum: [
      //   'technical',
      //   'billing',
      //   'general',
      //   'complaint',
      //   'dispute',
      //   'other',
      // ],
      required: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    against: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    user_type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
    },
    attachments: [String],
    is_deleted: {
      type: Boolean,
      default: false,
    },
    created_by_admin: {
      type: Boolean,
      default: false,
    },
    date_closed: {
      type: Date,
      default: null,
    },
    resource_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      refPath: 'resource_type',
    },
    resource_type: {
      type: String,
      enum: ['Review', 'ServiceRequest'],
      default: 'user',
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
