import * as mongoose from 'mongoose';

export interface Setting extends mongoose.Document {
  readonly id: string;
  siteTitle: string;
  siteSubtitle: string;
  currency: string;
  minimumOrderAmount: number;
  walletToCurrencyRatio: number;
  signupPoints: number;
  logo: string;
  taxClass: string;
  shippingClass: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
