import * as mongoose from 'mongoose';

export interface Ticket extends mongoose.Document {
  readonly id: string;
  ticket_number: string;
  subject: string;
  description: string;
  status: 'pending' | 'open' | 'in_review' | 'closed';
  priority: 'low' | 'medium' | 'high';
  category: string;
  created_by: string;
  assigned_to?: string;
  attachments: string[];
  is_deleted: boolean;
  user_type: string;
  created_by_admin: boolean;
  date_closed: Date;
  email: string;
  phone: string;
  name: string;
  readonly createdAt: Date;
  updatedAt: Date;
}
