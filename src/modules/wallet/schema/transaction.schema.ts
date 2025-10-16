import * as mongoose from 'mongoose';

export const TransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    fullname: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    trx_id: {
      type: String,
    },
    tx_ref: {
      type: String,
      required: true,
      unique: true,
    },
    flw_ref: {
      type: String,
    },
    device_fingerprint: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    charged_amount: {
      type: Number,
    },
    app_fee: {
      type: Number,
    },
    merchant_fee: {
      type: Number,
    },
    processor_response: {
      type: String,
    },
    auth_model: {
      type: String,
    },
    currency: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
    },
    narration: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      defaultValue: 'initiated',
    },
    auth_url: {
      type: String,
    },
    payment_type: {
      type: String,
    },
    plan: {
      type: String,
    },
    fraud_status: {
      type: String,
    },
    charge_type: {
      type: String,
    },
    created_at: {
      type: Date,
    },
    account_id: {
      type: String,
    },
    customer: {
      type: String,
    },
    card: {
      type: String,
    },
    details: {
      type: String,
    },
    type: {
      type: String,
      enum: [
        'wallet',
        'subscription',
        'charity',
        'token',
        'group',
        'focusGroup',
      ],
      default: 'wallet',
    },
    group: {
      type: Boolean,
      default: false,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Charity',
    },
  },

  { timestamps: true },
);

TransactionSchema.method('toJSON', function () {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { __v, ...object } = this.toObject();
  const newObject = {
    ...object,
  };

  return newObject;
});
