import * as mongoose from 'mongoose';

export interface Ticket extends mongoose.Document {
  readonly id: string;
  ticket_number: string;
  title: string;
  description: string;
  status: 'open' | 'in_review' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'general' | 'complaint' | 'dispute';
  created_by: string;
  assigned_to?: string;
  attachments: Array<{
    filename: string;
    original_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
  }>;
  is_deleted: boolean;
  readonly createdAt: Date;
  updatedAt: Date;
}
