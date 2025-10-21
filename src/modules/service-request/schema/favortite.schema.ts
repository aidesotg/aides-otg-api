import * as mongoose from 'mongoose';
import { Favorite } from '../interface/favorite.interface';

export const FavoriteSchema = new mongoose.Schema<Favorite>(
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
