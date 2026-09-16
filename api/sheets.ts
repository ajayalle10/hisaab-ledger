import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';
import { appendRow, readTab, updateField } from './_lib/sheets.js';
import type { Loan, Payment, Person, Transaction } from './_lib/types.js';

const PEOPLE_COLUMNS = ['id', 'name', 'contact', 'notes'];
const LOAN_COLUMNS = [
  'id', 'personId', 'direction', 'principal', 'dateGiven',
  'interestRatePctPerMonth', 'promisedReturnDate', 'nickname', 'status', 'notes', 'paymentMode',
];
// personName/loanNickname are denormalized (looked up and written at save
// time) purely so the raw sheet is readable by a human without cross
// referencing loanId — appended at the end so existing rows/columns don't shift.
const PAYMENT_COLUMNS = [
  'id', 'loanId', 'date', 'totalAmount', 'principalPortion', 'interestPortion', 'paymentMode', 'notes',
  'personName', 'loanNickname',
];
const TRANSACTION_COLUMNS = ['id', 'date', 'type', 'amount', 'category', 'paymentMode', 'notes', 'title'];

function toPerson(r: Record<string, string>): Person {
  return { id: r.id, name: r.name, contact: r.contact || undefined, notes: r.notes || undefined };
}

function toLoan(r: Record<string, string>): Loan {
  return {
    id: r.id,
    personId: r.personId,
    direction: r.direction as Loan['direction'],
    principal: Number(r.principal),
    dateGiven: r.dateGiven,
    interestRatePctPerMonth: Number(r.interestRatePctPerMonth),
    promisedReturnDate: r.promisedReturnDate || undefined,
    nickname: r.nickname || undefined,
    status: r.status as Loan['status'],
    notes: r.notes || undefined,
    paymentMode: r.paymentMode as Loan['paymentMode'],
  };
}

function toPayment(r: Record<string, string>): Payment {
  return {
    id: r.id,
    loanId: r.loanId,
    date: r.date,
    totalAmount: Number(r.totalAmount),
    principalPortion: Number(r.principalPortion),
    interestPortion: Number(r.interestPortion),
    paymentMode: r.paymentMode as Payment['paymentMode'],
    notes: r.notes || undefined,
    personName: r.personName || undefined,
    loanNickname: r.loanNickname || undefined,
  };
}

function toTransaction(r: Record<string, string>): Transaction {
  return {
    id: r.id,
    date: r.date,
    type: r.type as Transaction['type'],
    amount: Number(r.amount),
    category: r.category as Transaction['category'],
    paymentMode: r.paymentMode as Transaction['paymentMode'],
    notes: r.notes || undefined,
    title: r.title || undefined,
  };
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

interface CreateLoanInput {
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

async function createLoan(input: CreateLoanInput) {
  const people = (await readTab('People', PEOPLE_COLUMNS)).map(toPerson);
  const target = normalizeName(input.personName);
  const match = people.find((p) => normalizeName(p.name) === target);

  if (match && !input.nickname?.trim()) {
    const loans = (await readTab('Loans', LOAN_COLUMNS)).map(toLoan);
    const existingLoanCount = loans.filter((l) => l.personId === match.id).length;
    return { needsNickname: true, personId: match.id, personName: match.name, existingLoanCount };
  }

  let personId: string;
  if (match) {
    personId = match.id;
  } else {
    personId = uuidv4();
    await appendRow('People', PEOPLE_COLUMNS, { id: personId, name: input.personName.trim() });
  }

  const loan: Loan = {
    id: uuidv4(),
    personId,
    direction: input.direction,
    principal: input.principal,
    dateGiven: input.dateGiven,
    interestRatePctPerMonth: input.interestRatePctPerMonth,
    promisedReturnDate: input.promisedReturnDate,
    nickname: input.nickname?.trim() || undefined,
    status: 'active',
    notes: input.notes,
    paymentMode: input.paymentMode,
  };
  await appendRow('Loans', LOAN_COLUMNS, loan as unknown as Record<string, unknown>);
  return { loan };
}

interface AddPaymentInput {
  loanId: string;
  date: string;
  totalAmount: number;
  principalPortion: number;
  interestPortion: number;
  paymentMode: Payment['paymentMode'];
  notes?: string;
}

async function addPayment(input: AddPaymentInput) {
  const loans = (await readTab('Loans', LOAN_COLUMNS)).map(toLoan);
  const loan = loans.find((l) => l.id === input.loanId);
  let personName: string | undefined;
  if (loan) {
    const people = (await readTab('People', PEOPLE_COLUMNS)).map(toPerson);
    personName = people.find((p) => p.id === loan.personId)?.name;
  }

  const payment: Payment = {
    id: uuidv4(),
    loanId: input.loanId,
    date: input.date,
    totalAmount: input.totalAmount,
    principalPortion: input.principalPortion || 0,
    interestPortion: input.interestPortion || 0,
    paymentMode: input.paymentMode,
    notes: input.notes,
    personName,
    loanNickname: loan?.nickname,
  };
  await appendRow('Payments', PAYMENT_COLUMNS, payment as unknown as Record<string, unknown>);
  return { payment };
}

interface AddTransactionInput {
  date: string;
  type: Transaction['type'];
  amount: number;
  category: Transaction['category'];
  paymentMode: Transaction['paymentMode'];
  notes?: string;
  title?: string;
}

async function addTransaction(input: AddTransactionInput) {
  const transaction: Transaction = {
    id: uuidv4(),
    date: input.date,
    type: input.type,
    amount: input.amount,
    category: input.category,
    paymentMode: input.paymentMode,
    notes: input.notes,
    title: input.title,
  };
  await appendRow('Transactions', TRANSACTION_COLUMNS, transaction as unknown as Record<string, unknown>);
  return { transaction };
}

interface UpdateLoanStatusInput {
  loanId: string;
  status: Loan['status'];
}

async function updateLoanStatus(input: UpdateLoanStatusInput) {
  await updateField('Loans', LOAN_COLUMNS, input.loanId, 'status', input.status);
  return { loanId: input.loanId, status: input.status };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Explicit CORS handling — this is the whole reason to move off Apps
  // Script, which cannot send these headers at all.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const action = req.query.action as string;
      let data: unknown;
      if (action === 'getPeople') data = (await readTab('People', PEOPLE_COLUMNS)).map(toPerson);
      else if (action === 'getLoans') data = (await readTab('Loans', LOAN_COLUMNS)).map(toLoan);
      else if (action === 'getPayments') data = (await readTab('Payments', PAYMENT_COLUMNS)).map(toPayment);
      else if (action === 'getTransactions') data = (await readTab('Transactions', TRANSACTION_COLUMNS)).map(toTransaction);
      else {
        res.status(400).json({ error: 'Unknown action: ' + action });
        return;
      }
      res.status(200).json({ data });
      return;
    }

    if (req.method === 'POST') {
      const { action, payload } = req.body as { action: string; payload: unknown };
      let data: unknown;
      if (action === 'createLoan') data = await createLoan(payload as CreateLoanInput);
      else if (action === 'addPayment') data = await addPayment(payload as AddPaymentInput);
      else if (action === 'addTransaction') data = await addTransaction(payload as AddTransactionInput);
      else if (action === 'updateLoanStatus') data = await updateLoanStatus(payload as UpdateLoanStatusInput);
      else {
        res.status(400).json({ error: 'Unknown action: ' + action });
        return;
      }
      res.status(200).json({ data });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}
