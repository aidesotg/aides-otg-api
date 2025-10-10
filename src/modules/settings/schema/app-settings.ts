import * as mongoose from 'mongoose';

export const SettingSchema = new mongoose.Schema(
  {
    siteTitle: {
      type: String,
    },
    siteSubtitle: {
      type: String,
    },
    currency: {
      type: String,
    },
    minimumOrderAmount: {
      type: Number,
    },
    walletToCurrencyRatio: {
      type: Number,
    },
    signupPoints: {
      type: Number,
    },
    deliveryTime: {
      title: { type: String },
      description: { type: String },
    },
    logo: {
      thumbnail: { type: String },
      original: { type: String },
    },
    taxClass: {
      type: String,
    },
    shippingClass: {
      type: String,
    },
    seo: {
      metaTitle: { type: String },
      metaDescription: { type: String },
      ogTitle: { type: String },
      ogDescription: { type: String },
      ogImage: {
        thumbnail: { type: String },
        original: { type: String },
      },
      twitterHandle: { type: String },
      twitterCardType: { type: String },
      metaTags: { type: String },
      canonicalUrl: { type: String },
    },
    contactDetails: {
      socials: [{ icon: { type: String }, url: { type: String } }],
      contact: { type: String },
      location: {
        lat: { type: Number },
        lng: { type: Number },
        city: { type: String },
        state: { type: String },
        country: { type: String },
        zip: { type: String },
        formattedAddress: { type: String },
      },
      website: { type: String },
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
