import * as mongoose from 'mongoose';

export const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    title: {
      type: String,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
    },
    resource: {
      type: String,
    },
    resource_id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    isGeneral: {
      type: Boolean,
      default: false,
    },
    is_read: {
      type: Boolean,
      default: false,
    },
    mode: {
      type: String,
      enum: ['client', 'admin', 'caregiver'],
      default: 'client',
    },
  },
  { timestamps: true },
);

NotificationSchema.method('toJSON', function () {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { __v, ...object } = this.toObject();
  const newObject = {
    ...object,
  };
  return newObject;
});
