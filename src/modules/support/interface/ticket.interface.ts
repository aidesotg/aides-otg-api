import * as mongoose from 'mongoose';

export interface Ticket extends mongoose.Document {
  readonly id: string;
  ticket_number: string;
  subject: string;
  description: string;
  status: 'open' | 'in_review' | 'closed';
  priority: 'low' | 'medium' | 'high';
  category:
    | 'technical'
    | 'billing'
    | 'general'
    | 'complaint'
    | 'dispute'
    | 'other';
  created_by: string;
  assigned_to?: string;
  attachments: string[];
  is_deleted: boolean;
  readonly createdAt: Date;
  updatedAt: Date;
}
