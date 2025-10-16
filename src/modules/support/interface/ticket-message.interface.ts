import * as mongoose from 'mongoose';

export interface TicketMessage extends mongoose.Document {
  readonly id: string;
  ticket: string;
  sender: string;
  message: string;
  attachments: string[];
  is_internal: boolean;
  is_deleted: boolean;
  readonly createdAt: Date;
  updatedAt: Date;
}
