import * as mongoose from 'mongoose';
import { Patient } from '../interface/patient.interface';

export const PatientSchema = new mongoose.Schema<Patient>(
  {
    fullname: {
      type: String,
      required: true,
    },
    date_of_birth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zip_code: String,
      location: {},
    },
    emergency_contact: {
      name: String,
      phone: String,
      relationship: String,
    },
    medical_conditions: [String],
    allergies: [String],
    medications: [String],
    insurance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Insurance',
    },
    insurance_details: {
      policy_number: String,
      expiry_date: Date,
      coverage_percentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 100,
      },
      is_verified: {
        type: Boolean,
        default: false,
      },
      verification_date: Date,
      total_hours_available: {
        type: Number,
        default: 0,
      },
      hours_used: {
        type: Number,
        default: 0,
      },
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    is_active: {
      type: Boolean,
      default: true,
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

PatientSchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  return object;
});

PatientSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'patient',
});

PatientSchema.virtual('appointments', {
  ref: 'Appointment',
  localField: '_id',
  foreignField: 'patient',
});

PatientSchema.virtual('transactions', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'patient',
});
