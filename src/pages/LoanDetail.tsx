import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../data/DataContext';
import { BackBar } from '../components/BackBar';
import { KeyFactsList } from '../components/KeyFactsList';
import { NoteCard } from '../components/NoteCard';
import { Rows } from '../components/Row';
import { isOverdue, loanPayments, outstandingPrincipal } from '../lib/derive';
import { formatDate, formatINR } from '../lib/format';

function paymentLabel(principalPortion: number, interestPortion: number): string {
  if (principalPortion > 0 && interestPortion > 0) return 'Principal + interest';
  if (principalPortion > 0) return 'Principal only';
  if (interestPortion > 0) return 'Interest only';
  return 'Payment';
}

export function LoanDetail() {
  const { loanId } = useParams<{ loanId: string }>();
  const { loans, payments, getPerson, updateLoanStatus } = useData();
  const navigate = useNavigate();
  const [statusBusy, setStatusBusy] = useState(false);

  const loan = loans.find((l) => l.id === loanId);
  if (!loan) return <div className="screen">Loan not found.</div>;

  const person = getPerson(loan.personId);
  const outstanding = outstandingPrincipal(loan, payments);
  const history = loanPayments(loan.id, payments);
  const overdue = isOverdue(loan);

  async function toggleStatus() {
    setStatusBusy(true);
    try {
      await updateLoanStatus(loan!.id, loan!.status === 'active' ? 'closed' : 'active');
    } finally {
      setStatusBusy(false);
    }
  }

  const facts = [
    { k: 'Principal', v: formatINR(loan.principal) },
    { k: 'Interest rate', v: `${loan.interestRatePctPerMonth}% / month` },
    { k: 'Outstanding', v: formatINR(outstanding) },
    loan.direction === 'given'
      ? {
          k: 'Promised return',
          v: loan.promisedReturnDate
            ? `by ${formatDate(loan.promisedReturnDate)}${overdue ? ' — overdue' : ''}`
            : '— none set',
          vColor: overdue ? 'var(--maroon)' : undefined,
        }
      : { k: 'Direction', v: 'He owes them', vColor: 'var(--green)' },
    { k: 'Status', v: loan.status === 'active' ? 'Active' : 'Closed' },
  ];

  return (
    <div className="screen">
      <BackBar
        title={person?.name ?? 'Unknown'}
        sub={`${loan.nickname ? loan.nickname + ' · ' : ''}given ${formatDate(loan.dateGiven)}`}
        fallback={`/people/${loan.personId}`}
      />
      <section>
        <KeyFactsList facts={facts} />
        {loan.notes && <NoteCard>{loan.notes}</NoteCard>}

        <div className="section-label">
          PAYMENT HISTORY <span className="count">{history.length}</span>
        </div>
        <Rows empty="No payments logged yet.">
          {history.map((p) => (
            <div className="row static" key={p.id}>
              <div className="left">
                <div className="name">{paymentLabel(p.principalPortion, p.interestPortion)}</div>
                <div className="meta">
                  {formatDate(p.date)} · {p.paymentMode}
                </div>
              </div>
              <div className="amt neutral">{formatINR(p.totalAmount)}</div>
            </div>
          ))}
        </Rows>
      </section>
      <div className="actions">
        <button className="btn primary" onClick={() => navigate(`/payments/new?loanId=${loan.id}`)}>
          Log payment
        </button>
        <button className="btn" onClick={toggleStatus} disabled={statusBusy}>
          {statusBusy ? 'Saving…' : loan.status === 'active' ? 'Mark as closed' : 'Reopen loan'}
        </button>
      </div>
    </div>
  );
}
