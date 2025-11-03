import * as mongoose from 'mongoose';

export const SettingSchema = new mongoose.Schema(
  {
    company_name: {
      type: String,
    },
    registration_id: {
      type: String,
    },
    company_email: {
      type: String,
    },
    company_phone: {
      type: String,
    },
    website: {
      type: String,
    },
    address: {
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
    company_photo: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

SettingSchema.method('toJSON', function () {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { __v, ...object } = this.toObject();
  const newObject = {
    ...object,
  };
  return newObject;
});
