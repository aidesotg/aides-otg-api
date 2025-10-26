import * as mongoose from 'mongoose';
import { Review } from '../interface/review.interface';

export const ReviewSchema = new mongoose.Schema<Review>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRequest',
    },
    care_giver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rating: {
      type: Number,
      default: 0,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

ReviewSchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  return object;
});
