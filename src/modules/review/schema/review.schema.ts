import * as mongoose from 'mongoose';
import { Review } from '../interface/review.interface';

export const ReviewSchema = new mongoose.Schema<Review>(
  {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    caregiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
    is_reported: {
      type: Boolean,
      default: false,
    },
    report_reason: {
      type: String,
    },
    report_details: {
      type: String,
    },
    reported_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    is_suspended: {
      type: Boolean,
      default: false,
    },
    suspended_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    suspension_reason: {
      type: String,
    },
    is_deleted: {
      type: Boolean,
      default: false,
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

// Ensure one review per booking
ReviewSchema.index({ booking: 1 }, { unique: true });
