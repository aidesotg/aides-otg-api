import * as mongoose from 'mongoose';
import { ServiceCategory } from '../interface/service-category.interface';

export const ServiceCategorySchema = new mongoose.Schema<ServiceCategory>(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    cover_image: {
      type: String,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

ServiceCategorySchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  return object;
});

ServiceCategorySchema.virtual('services', {
  ref: 'Service',
  localField: '_id',
  foreignField: 'category',
});
