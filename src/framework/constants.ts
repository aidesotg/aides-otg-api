const transactionTypes = {
  WALLET: 'WALLET',
  SUBSCRIPTION: 'SUBSCRIPTION',
  PURCHASE: 'PURCHASE',
};

const transactionStatus = {
  STARTED: 'STARTED',
  INPROGRESS: 'IN-PROGRESS',
  COMPLETED: 'COMPLETED',
};

const transactionGenus = {
  TRANSFER: 'TRANSFER',
  WITHDRAWAL: 'WITHDRAWAL',
  DEPOSIT: 'DEPOSIT',
  PAYMENT: 'PAYMENT',
  REFERRAL: 'REFERRAL',
  EARNED: 'EARNED',
  PURCHASE: 'PURCHASE',
};

const paymentStatuses = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  REFUNDED: 'REFUNDED',
};

const requestStatuses = {
  REQUESTED: 'requested',
  ACCEPTED: 'accepted',
  ONGOING: 'on-going',
  COMPLETED: 'completed',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

const roles = {
  SUPER_ADMIN: 'Super Admin',
  SUPPORT_ADMIN: 'Support Admin',
  CLIENT: 'Client',
  INSURANCE_ADMIN: 'Insurance Admin',
  CARE_GIVER: 'Care Giver',
};

export const FLUTTERWAVE_SUPPORTED_COUNTRIES = [
  {
    country: 'Argentina',
    currency: 'ARS',
    code: 'AR',
    processor: 'flutterwave',
  },
  {
    country: 'Czech Republic',
    currency: 'CZK',
    code: 'CZ',
    processor: 'flutterwave',
  },
  {
    country: 'Ethiopia',
    currency: 'ETB',
    processor: 'flutterwave',
    code: 'ET',
  },
  { country: 'Ghana', currency: 'GHS', processor: 'flutterwave', code: 'GH' },
  { country: 'Israel', currency: 'ILS', processor: 'flutterwave', code: 'IL' },
  { country: 'Kenya', currency: 'KES', processor: 'flutterwave', code: 'KE' },
  { country: 'Morocco', currency: 'MAD', processor: 'flutterwave', code: 'MA' },
  {
    country: 'Mauritius',
    currency: 'MUR',
    processor: 'flutterwave',
    code: 'MU',
  },
  { country: 'Nigeria', currency: 'NGN', processor: 'flutterwave', code: 'NG' },
  { country: 'Peru', currency: 'PEN', processor: 'flutterwave', code: 'PE' },
  { country: 'Russia', currency: 'RUB', processor: 'flutterwave', code: 'RU' },
  { country: 'Rwanda', currency: 'RWF', processor: 'flutterwave', code: 'RW' },
  {
    country: 'Saudi Arabia',
    currency: 'SAR',
    processor: 'flutterwave',
    code: 'SA',
  },
  {
    country: 'Sierra Leone',
    currency: 'SLL',
    processor: 'flutterwave',
    code: 'SL',
  },
  {
    country: 'Tanzania',
    currency: 'TZS',
    processor: 'flutterwave',
    code: 'TZ',
  },
  { country: 'Uganda', currency: 'UGX', processor: 'flutterwave', code: 'UG' },
  {
    country: 'Cameroon',
    currency: 'XAF',
    processor: 'flutterwave',
    code: 'CM',
  },
  { country: 'Chad', currency: 'XAF', processor: 'flutterwave', code: 'TD' },
  { country: 'Congo', currency: 'XAF', processor: 'flutterwave', code: 'CG' },
  { country: 'Benin', currency: 'XOF', processor: 'flutterwave', code: 'BJ' },
  { country: 'Senegal', currency: 'XOF', processor: 'flutterwave', code: 'SN' },
  { country: 'Togo', currency: 'XOF', processor: 'flutterwave', code: 'TG' },
  {
    country: 'South Africa',
    currency: 'ZAR',
    processor: 'flutterwave',
    code: 'ZA',
  },
  {
    country: 'Zambia pre 2013',
    currency: 'ZMK',
    processor: 'flutterwave',
    code: 'ZM',
  },
  {
    country: 'Zambia post 2013',
    currency: 'ZMW',
    processor: 'flutterwave',
    code: 'ZM',
  },
  { country: 'Malawi', currency: 'MWK', processor: 'flutterwave', code: 'MW' },
];

export const STRIPE_SUPPORTED_COUNTRIES = [
  { country: 'Australia', currency: 'AUD', processor: 'stripe', code: '' },
  { country: 'Austria', currency: 'EUR', processor: 'stripe', code: '' },
  { country: 'Belgium', currency: 'EUR', processor: 'stripe', code: '' },
  { country: 'Brazil', currency: 'BRL', processor: 'stripe', code: '' },
  { country: 'Bulgaria', currency: 'BGN', processor: 'stripe', code: '' },
  { country: 'Canada', currency: 'CAD', processor: 'stripe', code: '' },
  { country: 'Croatia', currency: 'HRK', processor: 'stripe', code: '' },
  { country: 'Cyprus', currency: 'EUR', processor: 'stripe', code: '' },
  {
    country: 'Czech Republic',
    currency: 'CZK',
    processor: 'stripe',
    code: '',
  },
  { country: 'Denmark', currency: 'DKK', processor: 'stripe', code: '' },
  { country: 'Estonia', currency: 'EUR', processor: 'stripe', code: '' },
  { country: 'Finland', currency: 'EUR', processor: 'stripe', code: '' },
  { country: 'France', currency: 'EUR', processor: 'stripe', code: '' },
  { country: 'Germany', currency: 'EUR', processor: 'stripe', code: '' },
  { country: 'Gibraltar', currency: 'GIP', processor: 'stripe', code: '' },
  { country: 'Greece', currency: 'EUR', processor: 'stripe', code: '' },
  { country: 'Hong Kong', currency: 'HKD', processor: 'stripe', code: '' },
  { country: 'Hungary', currency: 'HUF', processor: 'stripe', code: '' },
  { country: 'India', currency: 'INR', processor: 'stripe', code: '' },
  { country: 'Indonesia', currency: 'IDR', processor: 'stripe', code: '' },
  { country: 'Ireland', currency: 'EUR', processor: 'stripe', code: '' },
  { country: 'Italy', currency: 'EUR', processor: 'stripe', code: '' },
  { country: 'Japan', currency: 'JPY', processor: 'stripe', code: '' },
  { country: 'Latvia', currency: 'EUR', processor: 'stripe', code: '' },
  {
    country: 'Liechtenstein',
    currency: 'CHF',
    processor: 'stripe',
    code: '',
  },
  { country: 'Lithuania', currency: 'EUR', processor: 'stripe', code: '' },
  {
    country: 'Luxembourg',
    currency: 'EUR',
    processor: 'stripe',
    code: '',
  },
  { country: 'Malaysia', currency: 'MYR', processor: 'stripe', code: '' },
  { country: 'Malta', currency: 'EUR', processor: 'stripe', code: '' },
  { country: 'Mexico', currency: 'MXN', processor: 'stripe', code: '' },
  {
    country: 'Netherlands',
    currency: 'EUR',
    processor: 'stripe',
    code: '',
  },
  {
    country: 'New Zealand',
    currency: 'NZD',
    processor: 'stripe',
    code: '',
  },
  { country: 'Norway', currency: 'NOK', processor: 'stripe', code: '' },
  { country: 'Poland', currency: 'PLN', processor: 'stripe', code: '' },
  { country: 'Portugal', currency: 'EUR', processor: 'stripe', code: '' },
  { country: 'Romania', currency: 'RON', processor: 'stripe', code: '' },
  { country: 'Singapore', currency: 'SGD', processor: 'stripe', code: '' },
  { country: 'Slovakia', currency: 'EUR', processor: 'stripe', code: '' },
  { country: 'Slovenia', currency: 'EUR', processor: 'stripe', code: '' },
  { country: 'Spain', currency: 'EUR', processor: 'stripe', code: '' },
  { country: 'Sweden', currency: 'SEK', processor: 'stripe', code: '' },
  {
    country: 'Switzerland',
    currency: 'CHF',
    processor: 'stripe',
    code: '',
  },
  { country: 'Thailand', currency: 'THB', processor: 'stripe', code: '' },
  {
    country: 'United Arab Emirates',
    currency: 'AED',
    processor: 'stripe',
    code: '',
  },
  {
    country: 'United Kingdom',
    currency: 'GBP',
    processor: 'stripe',
    code: '',
  },
  {
    country: 'United States',
    currency: 'USD',
    processor: 'stripe',
    code: '',
  },
];

const userPopulateFields =
  ' -__v -password -device_token -stripeConnect -ssn -twoFactorSecret -twoFactorSmsToken -activation_code -activation_expires_in';

export const DEFAULT_TIMEZONE = 'America/New_York';

export const notificationResourceTypes = {
  LEAVE_A_REVIEW: 'leave_a_review',
  NEW_FEATURE_UPDATES: 'new_feature_updates',
  SECURITY_ALERT: 'security_alert',
  PROFILE_UPDATED: 'profile_updated',
  CARE_IN_PROGRESS: 'care_in_progress',
  CARE_COMPLETED: 'care_completed',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  PAYMENT_FAILED: 'payment_failed',
  INVOICE_RECEIPT: 'invoice_receipt',
  REQUEST_ACCEPTED: 'request_accepted',
  REQUEST_DECLINED: 'request_declined',
  NO_RESPONSE: 'no_response',
  REQUEST_CANCELED: 'request_canceled',
  REQUEST_EDITED: 'request_edited',
  ON_MY_WAY: 'on_my_way',
  CAREGIVER_ARRIVED: 'caregiver_arrived',
};

// Mapping of filter categories to notification resource types
export const notificationFilterCategories = {
  REQUESTS: [
    notificationResourceTypes.REQUEST_ACCEPTED,
    notificationResourceTypes.REQUEST_DECLINED,
    notificationResourceTypes.NO_RESPONSE,
    notificationResourceTypes.REQUEST_CANCELED,
    notificationResourceTypes.REQUEST_EDITED,
  ],
  PAYMENTS: [
    notificationResourceTypes.PAYMENT_CONFIRMED,
    notificationResourceTypes.PAYMENT_FAILED,
    notificationResourceTypes.INVOICE_RECEIPT,
  ],
  CAREGIVER_UPDATES: [
    notificationResourceTypes.ON_MY_WAY,
    notificationResourceTypes.CAREGIVER_ARRIVED,
    notificationResourceTypes.CARE_IN_PROGRESS,
    notificationResourceTypes.CARE_COMPLETED,
  ],
  SYSTEM_SECURITY: [
    notificationResourceTypes.SECURITY_ALERT,
    notificationResourceTypes.PROFILE_UPDATED,
    notificationResourceTypes.NEW_FEATURE_UPDATES,
    notificationResourceTypes.LEAVE_A_REVIEW,
  ],
};

const constants = {
  transactionTypes,
  transactionStatus,
  transactionGenus,
  requestStatuses,
  paymentStatuses,
  roles,
  STRIPE_SUPPORTED_COUNTRIES,
  FLUTTERWAVE_SUPPORTED_COUNTRIES,
  userPopulateFields,
  DEFAULT_TIMEZONE,
  notificationResourceTypes,
  notificationFilterCategories,
};

export default constants;
