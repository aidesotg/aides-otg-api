import * as mongoose from 'mongoose';

export interface Permission extends mongoose.Document {
  readonly id: string;
  readonly module: string;
  readonly name: string;
  readonly description: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
