/* eslint-disable @typescript-eslint/no-unused-vars */
import * as mongoose from 'mongoose';
import { Role } from '../interface/role.interface';

export const RoleSchema = new mongoose.Schema<Role>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true },
);

RoleSchema.method('toJSON', function () {
  const { __v, id, ...object } = this.toObject();
  const newObject = {
    ...object,
  };
  return newObject;
});
