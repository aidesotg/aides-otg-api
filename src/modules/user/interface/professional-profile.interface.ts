import * as mongoose from 'mongoose';

export interface ProfessionalProfile extends mongoose.Document {
  readonly id: string;
  profile_id: string;
  user: string;
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
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
