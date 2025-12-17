import { ProfessionalProfile } from '../interface/professional-profile.interface';
import * as mongoose from 'mongoose';
import { UserSchema } from './user.schema';

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
      caregiver_type: {
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
      suspension_reason: {
        type: String,
      },
      documents: {
        type: [String],
      },
      areas_covered: [
        {
          street: {
            type: String,
          },
          city: {
            type: String,
          },
          state: {
            type: String,
          },
          country: {
            type: String,
          },
          zip_code: {
            type: String,
          },
        },
      ],
      kyc: {
        government_id: {
          type: String,
        },
        selfie_with_id: {
          type: String,
        },
        status: {
          type: String,
        },
        reason: {
          type: String,
        },
      },
      payout: {
        bank_name: {
          type: String,
        },
        account_number: {
          type: String,
        },
        account_name: {
          type: String,
        },
        routing_number: {
          type: String,
        },
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

ProfessionalProfileSchema.virtual('total_care_given', {
  ref: 'ServiceRequestDayLogs',
  localField: 'user',
  foreignField: 'care_giver',
  match: { status: 'Completed' },
  count: true,
});
