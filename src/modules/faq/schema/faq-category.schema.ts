import * as mongoose from 'mongoose';

export const FaqCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
  },
  { timestamps: true },
);

FaqCategorySchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  const newObject = {
    ...object,
  };

  return newObject;
});
