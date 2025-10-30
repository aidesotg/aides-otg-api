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
    scheduled_at: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'failed', 'cancelled', 'scheduled'],
      default: 'draft',
    },
    channels: [
      {
        type: [String],
        enum: ['email', 'in-app', 'push'],
        default: ['in-app'],
      },
    ],
    audience: [
      {
        type: String,
        enum: ['all', 'clients', 'caregivers'],
        default: 'all',
      },
    ],
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
