export type PaymentMode = 'Cash' | 'PhonePe' | 'Google Pay' | 'Bank transfer' | 'Other';

export type LoanDirection = 'given' | 'taken';

export type LoanStatus = 'active' | 'closed';

export type TransactionType = 'credit' | 'debit';

export type TransactionCategory =
  | 'Household'
  | 'Clothing'
  | 'Utilities'
  | 'Interest income'
  | 'Gift'
  | 'Other';

export interface Person {
  id: string;
  name: string;
  contact?: string;
  notes?: string;
}

export interface Loan {
  id: string;
  personId: string;
  direction: LoanDirection;
  principal: number;
  dateGiven: string; // ISO date
  interestRatePctPerMonth: number;
  promisedReturnDate?: string; // ISO date
  nickname?: string;
  status: LoanStatus;
  notes?: string;
  paymentMode: PaymentMode;
}

export interface Payment {
  id: string;
  loanId: string;
  date: string; // ISO date
  totalAmount: number;
  principalPortion: number;
  interestPortion: number;
  paymentMode: PaymentMode;
  notes?: string;
  // Denormalized at save time purely so the raw sheet is readable without
  // cross-referencing loanId — not authoritative, never used for matching.
  personName?: string;
  loanNickname?: string;
}

export interface Transaction {
  id: string;
  date: string; // ISO date
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  paymentMode: PaymentMode;
  notes?: string;
  title?: string; // short label: what the debit was for / who the credit was from
}
