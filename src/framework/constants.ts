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
  CUSTOMER: 'Customer',
  INSURANCE_ADMIN: 'Insurance Admin',
  CARE_GIVER: 'Care Giver',
};

const constants = {
  transactionTypes,
  transactionStatus,
  transactionGenus,
  requestStatuses,
  paymentStatuses,
  roles,
};

export default constants;
