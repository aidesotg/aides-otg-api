import * as mongoose from 'mongoose';

export interface RolePermission extends mongoose.Document {
  readonly id: string;
  readonly role: string;
  readonly permission: string;
  readonly permission_name: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
