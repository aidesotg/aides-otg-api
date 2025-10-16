import { ProfessionalProfile } from '../interface/professional-profile.interface';
import * as mongoose from 'mongoose';

export const ProfessionalProfileSchema =
  new mongoose.Schema<ProfessionalProfile>(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      profile_id: {
        type: String,
      },
      bio: {
        type: String,
      },
      license_url: {
        type: String,
      },
      id_url: {
        type: String,
      },
      verified: {
        type: Boolean,
        default: false,
      },
      experience: {
        type: Number,
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
      },
      specialization: {
        type: [String],
      },
      care_type_preferences: {
        type: [String],
      },
      certifications: {
        type: [String],
      },
      languages: {
        type: [String],
      },
      comment: {
        type: String,
      },
      reason: {
        type: String,
      },
      rating: {
        type: Number,
        default: 0,
      },
      suspended: {
        type: Boolean,
        default: false,
      },
      documents: {
        type: [String],
      },
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    },
  );

export const ProfessionalProfileModel = mongoose.model<ProfessionalProfile>(
  'ProfessionalProfile',
  ProfessionalProfileSchema,
);
