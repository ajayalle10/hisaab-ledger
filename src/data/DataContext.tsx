import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Loan, Payment, Person, Transaction } from '../types';
import { seedLoans, seedPayments, seedPeople, seedTransactions } from '../lib/mockData';
import { sheetsApi, sheetsEnabled } from '../lib/sheetsApi';

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface PersonMatch {
  person: Person;
  loanCount: number;
}

export interface NewLoanInput {
  personName: string;
  nickname?: string;
  direction: Loan['direction'];
  principal: number;
  dateGiven: string;
  interestRatePctPerMonth: number;
  promisedReturnDate?: string;
  paymentMode: Loan['paymentMode'];
  notes?: string;
}

export interface NewPaymentInput {
  loanId: string;
  date: string;
  totalAmount: number;
  principalPortion: number;
  interestPortion: number;
  paymentMode: Payment['paymentMode'];
  notes?: string;
}

export interface NewTransactionInput {
  date: string;
  type: Transaction['type'];
  amount: number;
  category: Transaction['category'];
  paymentMode: Transaction['paymentMode'];
  notes?: string;
  title?: string;
}

// Thrown by createLoan when the backend finds a name match the client's local
// cache didn't know about yet — AddLoan.tsx catches this to open the same
// nickname modal it shows for the normal (client-detected) case.
export class NeedsNicknameError extends Error {
  personId: string;
  personName: string;
  existingLoanCount: number;
  constructor(personId: string, personName: string, existingLoanCount: number) {
    super('This person already has loans on file — a nickname is required.');
    this.personId = personId;
    this.personName = personName;
    this.existingLoanCount = existingLoanCount;
  }
}

interface DataContextValue {
  loading: boolean;
  loadError: string | null;
  retryLoad: () => void;
  people: Person[];
  loans: Loan[];
  payments: Payment[];
  transactions: Transaction[];
  personNameById: Record<string, string>;
  getPerson: (id: string) => Person | undefined;
  getLoan: (id: string) => Loan | undefined;
  findPersonByName: (name: string) => PersonMatch | null;
  createLoan: (input: NewLoanInput) => Promise<Loan>;
  addPayment: (input: NewPaymentInput) => Promise<Payment>;
  addTransaction: (input: NewTransactionInput) => Promise<Transaction>;
  updateLoanStatus: (loanId: string, status: Loan['status']) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(sheetsEnabled);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [people, setPeople] = useState<Person[]>(sheetsEnabled ? [] : seedPeople);
  const [loans, setLoans] = useState<Loan[]>(sheetsEnabled ? [] : seedLoans);
  const [payments, setPayments] = useState<Payment[]>(sheetsEnabled ? [] : seedPayments);
  const [transactions, setTransactions] = useState<Transaction[]>(sheetsEnabled ? [] : seedTransactions);

  const fetchedRef = useRef(false);

  const loadAll = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [peopleRes, loansRes, paymentsRes, transactionsRes] = await Promise.all([
        sheetsApi.getPeople(),
        sheetsApi.getLoans(),
        sheetsApi.getPayments(),
        sheetsApi.getTransactions(),
      ]);
      setPeople(peopleRes);
      setLoans(loansRes);
      setPayments(paymentsRes);
      setTransactions(transactionsRes);
      setLoading(false);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load the sheet.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!sheetsEnabled || fetchedRef.current) return;
    // React 18 StrictMode double-invokes effects in dev; without this guard
    // every load would fire two full rounds of (slow) Apps Script requests.
    fetchedRef.current = true;
    void loadAll();
  }, []);

  const personNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of people) map[p.id] = p.name;
    return map;
  }, [people]);

  const getPerson = (id: string) => people.find((p) => p.id === id);
  const getLoan = (id: string) => loans.find((l) => l.id === id);

  const findPersonByName = (name: string): PersonMatch | null => {
    const target = normalizeName(name);
    if (!target) return null;
    const person = people.find((p) => normalizeName(p.name) === target);
    if (!person) return null;
    const loanCount = loans.filter((l) => l.personId === person.id).length;
    return { person, loanCount };
  };

  const createLoan = async (input: NewLoanInput): Promise<Loan> => {
    if (sheetsEnabled) {
      const result = await sheetsApi.createLoan(input);
      if (result.needsNickname) {
        throw new NeedsNicknameError(result.personId!, result.personName!, result.existingLoanCount!);
      }
      const loan = result.loan!;
      if (!people.some((p) => p.id === loan.personId)) {
        setPeople((prev) => [...prev, { id: loan.personId, name: input.personName.trim() }]);
      }
      setLoans((prev) => [...prev, loan]);
      return loan;
    }

    const match = findPersonByName(input.personName);
    let personId: string;
    if (match) {
      personId = match.person.id;
    } else {
      const person: Person = { id: makeId('p'), name: input.personName.trim() };
      setPeople((prev) => [...prev, person]);
      personId = person.id;
    }
    const loan: Loan = {
      id: makeId('l'),
      personId,
      direction: input.direction,
      principal: input.principal,
      dateGiven: input.dateGiven,
      interestRatePctPerMonth: input.interestRatePctPerMonth,
      promisedReturnDate: input.promisedReturnDate,
      nickname: input.nickname,
      status: 'active',
      notes: input.notes,
      paymentMode: input.paymentMode,
    };
    setLoans((prev) => [...prev, loan]);
    return loan;
  };

  const addPayment = async (input: NewPaymentInput): Promise<Payment> => {
    if (sheetsEnabled) {
      const { payment } = await sheetsApi.addPayment(input);
      setPayments((prev) => [...prev, payment]);
      return payment;
    }
    const payment: Payment = { id: makeId('pay'), ...input };
    setPayments((prev) => [...prev, payment]);
    return payment;
  };

  const addTransaction = async (input: NewTransactionInput): Promise<Transaction> => {
    if (sheetsEnabled) {
      const { transaction } = await sheetsApi.addTransaction(input);
      setTransactions((prev) => [...prev, transaction]);
      return transaction;
    }
    const transaction: Transaction = { id: makeId('txn'), ...input };
    setTransactions((prev) => [...prev, transaction]);
    return transaction;
  };

  const updateLoanStatus = async (loanId: string, status: Loan['status']): Promise<void> => {
    if (sheetsEnabled) {
      await sheetsApi.updateLoanStatus(loanId, status);
    }
    setLoans((prev) => prev.map((l) => (l.id === loanId ? { ...l, status } : l)));
  };

  const value: DataContextValue = {
    loading,
    loadError,
    retryLoad: () => void loadAll(),
    people,
    loans,
    payments,
    transactions,
    personNameById,
    getPerson,
    getLoan,
    findPersonByName,
    createLoan,
    addPayment,
    addTransaction,
    updateLoanStatus,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
}
