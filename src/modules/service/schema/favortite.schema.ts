import * as mongoose from 'mongoose';
import { Service } from '../interface/service.interface';
import { Favorite } from '../interface/favorite.interface';

export const FavoriteSchema = new mongoose.Schema<Favorite>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
    },
    care_giver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

FavoriteSchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  return object;
});
