import type { Loan, Payment, Transaction } from '../types';
import { addMonths, daysBetween, todayISO } from './format';

export function loanPayments(loanId: string, payments: Payment[]): Payment[] {
  return payments.filter((p) => p.loanId === loanId).sort((a, b) => a.date.localeCompare(b.date));
}

export function outstandingPrincipal(loan: Loan, payments: Payment[]): number {
  const paid = loanPayments(loan.id, payments).reduce((sum, p) => sum + p.principalPortion, 0);
  return Math.max(0, loan.principal - paid);
}

export function personLoans(personId: string, loans: Loan[]): Loan[] {
  return loans.filter((l) => l.personId === personId);
}

export interface PersonSummary {
  givenOutstanding: number;
  takenOutstanding: number;
  loanCount: number;
  hasOverdue: boolean;
}

export function personSummary(personId: string, loans: Loan[], payments: Payment[], today = todayISO()): PersonSummary {
  const loansForPerson = personLoans(personId, loans);
  let givenOutstanding = 0;
  let takenOutstanding = 0;
  let hasOverdue = false;
  for (const loan of loansForPerson) {
    const outstanding = outstandingPrincipal(loan, payments);
    if (loan.direction === 'given') givenOutstanding += outstanding;
    else takenOutstanding += outstanding;
    if (isOverdue(loan, today)) hasOverdue = true;
  }
  return { givenOutstanding, takenOutstanding, loanCount: loansForPerson.length, hasOverdue };
}

export function isOverdue(loan: Loan, today = todayISO()): boolean {
  return (
    loan.status === 'active' &&
    !!loan.promisedReturnDate &&
    loan.promisedReturnDate < today
  );
}

// Interest reminders repeat monthly on the anchor day: the day-of-month of the
// loan's most recent payment if it has one (so a regular payer's cycle tracks
// their real pattern, e.g. always the 25th), else the day-of-month it was given.
// The first cycle is always a full month after the anchor — a loan given
// today isn't "due" today, it's due one month from now.
export function nextInterestDueDate(loan: Loan, payments: Payment[], today = todayISO()): string {
  const history = loanPayments(loan.id, payments);
  const anchor = history.length ? history[history.length - 1].date : loan.dateGiven;
  const anchorDay = Number(anchor.slice(8, 10));

  let candidate = addMonths(anchor, 1);
  while (candidate < today) {
    candidate = addMonths(candidate, 1);
  }
  // addMonths can overshoot the anchor day when months have fewer days; clamp back.
  const [y, m] = candidate.split('-');
  const daysInMonth = new Date(Number(y), Number(m), 0).getDate();
  const day = Math.min(anchorDay, daysInMonth);
  return `${y}-${m}-${String(day).padStart(2, '0')}`;
}

export function expectedInterestAmount(loan: Loan, payments: Payment[]): number {
  const outstanding = outstandingPrincipal(loan, payments);
  return Math.round((outstanding * loan.interestRatePctPerMonth) / 100);
}

export type AgendaItem =
  | { kind: 'overdue'; loan: Loan; personName: string; dueDate: string; daysOverdue: number; amount: number }
  | { kind: 'reminder'; loan: Loan; personName: string; dueDate: string; daysUntil: number; amount: number };

export function homeAgenda(
  loans: Loan[],
  payments: Payment[],
  personNameById: Record<string, string>,
  today = todayISO(),
  daysAhead = 7,
): AgendaItem[] {
  const items: AgendaItem[] = [];
  for (const loan of loans) {
    if (loan.status !== 'active') continue;
    const personName = personNameById[loan.personId] ?? 'Unknown';
    if (isOverdue(loan, today)) {
      items.push({
        kind: 'overdue',
        loan,
        personName,
        dueDate: loan.promisedReturnDate!,
        daysOverdue: daysBetween(loan.promisedReturnDate!, today),
        amount: outstandingPrincipal(loan, payments),
      });
    }
    if (loan.direction === 'given') {
      const due = nextInterestDueDate(loan, payments, today);
      const daysUntil = daysBetween(today, due);
      if (daysUntil >= 0 && daysUntil <= daysAhead) {
        items.push({
          kind: 'reminder',
          loan,
          personName,
          dueDate: due,
          daysUntil,
          amount: expectedInterestAmount(loan, payments),
        });
      }
    }
  }
  return items.sort((a, b) => {
    if (a.kind === 'overdue' && b.kind !== 'overdue') return -1;
    if (b.kind === 'overdue' && a.kind !== 'overdue') return 1;
    const aDue = a.kind === 'overdue' ? a.dueDate : a.dueDate;
    const bDue = b.kind === 'overdue' ? b.dueDate : b.dueDate;
    return aDue.localeCompare(bDue);
  });
}

export function watchlist(loans: Loan[], today = todayISO()): Loan[] {
  return loans.filter((l) => isOverdue(l, today));
}

export function homeTotals(loans: Loan[], payments: Payment[]) {
  let givenOutstanding = 0;
  let takenOutstanding = 0;
  const people = new Set<string>();
  for (const loan of loans) {
    people.add(loan.personId);
    const outstanding = outstandingPrincipal(loan, payments);
    if (loan.direction === 'given') givenOutstanding += outstanding;
    else takenOutstanding += outstanding;
  }
  return { givenOutstanding, takenOutstanding, peopleCount: people.size };
}

export function dayTransactions(transactions: Transaction[], iso: string): Transaction[] {
  return transactions.filter((t) => t.date === iso);
}

export function periodTotals(transactions: Transaction[]) {
  let credit = 0;
  let debit = 0;
  for (const t of transactions) {
    if (t.type === 'credit') credit += t.amount;
    else debit += t.amount;
  }
  return { credit, debit };
}

export function monthTransactions(transactions: Transaction[], year: number, month: number): Transaction[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return transactions.filter((t) => t.date.startsWith(prefix));
}

export function yearMonthBreakdown(transactions: Transaction[], year: number) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  return months.map((month) => ({
    month,
    ...periodTotals(monthTransactions(transactions, year, month)),
  }));
}

// Days in a given month/year that have any loan or book activity — used for the calendar dots.
export function activityDaysInMonth(
  year: number,
  month: number,
  loans: Loan[],
  payments: Payment[],
  transactions: Transaction[],
): Set<number> {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const days = new Set<number>();
  const addIfInMonth = (iso: string | undefined) => {
    if (iso && iso.startsWith(prefix)) days.add(Number(iso.slice(8, 10)));
  };
  for (const loan of loans) {
    addIfInMonth(loan.dateGiven);
    addIfInMonth(loan.promisedReturnDate);
    if (loan.status === 'active' && loan.direction === 'given') {
      addIfInMonth(nextInterestDueDate(loan, payments));
    }
  }
  for (const p of payments) addIfInMonth(p.date);
  for (const t of transactions) addIfInMonth(t.date);
  return days;
}
