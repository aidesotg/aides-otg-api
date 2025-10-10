import * as mongoose from 'mongoose';

export const RolePermissionSchema = new mongoose.Schema(
  {
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
    },
    permission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Permission',
    },
    permission_name: {
      type: String,
    },
  },
  { timestamps: true },
);

RolePermissionSchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  const newObject = {
    ...object,
  };
  return newObject;
});
