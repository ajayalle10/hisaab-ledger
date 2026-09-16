import type { PaymentMode, TransactionCategory } from '../types';

export const PAYMENT_MODES: PaymentMode[] = ['Cash', 'PhonePe', 'Google Pay', 'Bank transfer', 'Other'];

export const TRANSACTION_CATEGORIES: TransactionCategory[] = [
  'Household',
  'Clothing',
  'Utilities',
  'Interest income',
  'Gift',
  'Other',
];
