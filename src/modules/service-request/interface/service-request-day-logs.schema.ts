import * as mongoose from 'mongoose';

export interface ServiceRequestDayLogs extends mongoose.Document {
  readonly id: string;
  request: string;
  day_id: string;
  status_history: {
    status: string;
    created_at: Date;
  }[];
  activity_trail: {
    on_my_way: boolean;
    arrived: boolean;
    in_progress: boolean;
    completed: boolean;
  };
  care_giver: mongoose.Schema.Types.ObjectId;
  status: string;
  readonly createdAt: Date;
  updatedAt: Date;
}
