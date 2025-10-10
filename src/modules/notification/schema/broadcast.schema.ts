import * as mongoose from 'mongoose';

export const BroadcastSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    body: {
      type: String,
      required: true,
    },
    isDraft: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

BroadcastSchema.method('toJSON', function () {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { __v, ...object } = this.toObject();
  const newObject = {
    ...object,
  };
  return newObject;
});
