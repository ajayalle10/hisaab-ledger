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
  dateGiven: string;
  interestRatePctPerMonth: number;
  promisedReturnDate?: string;
  nickname?: string;
  status: LoanStatus;
  notes?: string;
  paymentMode: PaymentMode;
}

export interface Payment {
  id: string;
  loanId: string;
  date: string;
  totalAmount: number;
  principalPortion: number;
  interestPortion: number;
  paymentMode: PaymentMode;
  notes?: string;
  personName?: string;
  loanNickname?: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  paymentMode: PaymentMode;
  notes?: string;
  title?: string;
}
