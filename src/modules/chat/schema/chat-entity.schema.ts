import * as mongoose from 'mongoose';

export const ChatEntitySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    firebase_uid: {
      type: String,
    },
    full_name: {
      type: String,
    },
    profile_picture: {
      type: String,
    },
    unread: {
      type: Number,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

ChatEntitySchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  const newObject = {
    ...object,
  };
  return newObject;
});
