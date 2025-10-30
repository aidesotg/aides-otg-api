import * as mongoose from 'mongoose';

export const FaqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
    },
    answer: {
      type: String,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FaqCategory',
    },
  },
  { timestamps: true },
);

FaqSchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  const newObject = {
    ...object,
  };

  return newObject;
});
