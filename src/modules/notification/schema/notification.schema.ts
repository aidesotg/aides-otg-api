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
    isGeneral: {
      type: Boolean,
      default: false,
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
