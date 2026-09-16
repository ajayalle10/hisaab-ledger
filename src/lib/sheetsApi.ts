import type { Loan, Payment, Person, Transaction } from '../types';
import type { NewLoanInput, NewPaymentInput, NewTransactionInput } from '../data/DataContext';

const API_URL = import.meta.env.VITE_SHEETS_API_URL;

// Until the backend is linked, the app runs on mock data rather than crash —
// see AddLoan/Home/etc, which all read this to decide where data comes from.
export const sheetsEnabled = Boolean(API_URL);

interface CreateLoanResult {
  loan?: Loan;
  needsNickname?: boolean;
  personId?: string;
  personName?: string;
  existingLoanCount?: number;
}

async function get<T>(action: string): Promise<T> {
  const res = await fetch(`${API_URL}?action=${action}`);
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error || `Request failed (${res.status})`);
  return json.data as T;
}

async function post<T>(action: string, payload: unknown): Promise<T> {
  const res = await fetch(API_URL as string, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error || `Request failed (${res.status})`);
  return json.data as T;
}

export const sheetsApi = {
  getPeople: () => get<Person[]>('getPeople'),
  getLoans: () => get<Loan[]>('getLoans'),
  getPayments: () => get<Payment[]>('getPayments'),
  getTransactions: () => get<Transaction[]>('getTransactions'),
  createLoan: (input: NewLoanInput) => post<CreateLoanResult>('createLoan', input),
  addPayment: (input: NewPaymentInput) => post<{ payment: Payment }>('addPayment', input),
  addTransaction: (input: NewTransactionInput) => post<{ transaction: Transaction }>('addTransaction', input),
  updateLoanStatus: (loanId: string, status: Loan['status']) =>
    post<{ loanId: string; status: Loan['status'] }>('updateLoanStatus', { loanId, status }),
};
