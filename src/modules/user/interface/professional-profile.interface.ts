import * as mongoose from 'mongoose';

export interface ProfessionalProfile extends mongoose.Document {
  readonly id: string;
  profile_id: string;
  user: string;
  caregiver_type: 'companion' | 'unlicensed' | 'licensed';
  bio: string;
  license_url: string;
  id_url: string;
  verified: boolean;
  experience: number;
  status: string;
  specialization: string[];
  care_type_preferences: string[];
  certifications: string[];
  documents: string[];
  languages: string[];
  comment: string;
  reason: string;
  rating: number;
  suspended: boolean;
  areas_covered: {
    street?: string;
    city: string;
    state: string;
    country: string;
    zip_code?: string;
  }[];
  kyc: {
    government_id: string;
    selfie_with_id: string;
    status: string;
    reason: string;
  };
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
