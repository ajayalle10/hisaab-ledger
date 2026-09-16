import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../data/DataContext';
import { BackBar } from '../components/BackBar';
import { Rows } from '../components/Row';
import { NoteCard } from '../components/NoteCard';
import { outstandingPrincipal, personLoans } from '../lib/derive';
import { formatDate, formatINR } from '../lib/format';

export function PersonDetail() {
  const { personId } = useParams<{ personId: string }>();
  const { people, loans, payments } = useData();
  const navigate = useNavigate();

  const person = people.find((p) => p.id === personId);
  if (!person) return <div className="screen">Person not found.</div>;

  const theirLoans = personLoans(person.id, loans);
  const activeLoans = theirLoans.filter((l) => l.status === 'active');
  const closedLoans = theirLoans.filter((l) => l.status === 'closed');

  function renderLoan(loan: (typeof theirLoans)[number]) {
    const outstanding = outstandingPrincipal(loan, payments);
    const promiseMeta = loan.promisedReturnDate
      ? `promised by ${formatDate(loan.promisedReturnDate)}`
      : 'no promise set';
    return (
      <button key={loan.id} className="row" onClick={() => navigate(`/loans/${loan.id}`)}>
        <div className="left">
          <div className="name">{loan.nickname || `Loan · ${formatDate(loan.dateGiven)}`}</div>
          <div className="meta">
            {formatDate(loan.dateGiven)} · {loan.interestRatePctPerMonth}%/mo · {promiseMeta}
          </div>
          {loan.status === 'closed' && <span className="flag ok">CLOSED</span>}
        </div>
        <div className={`amt ${loan.direction === 'given' ? 'given' : 'taken'}`}>{formatINR(outstanding)}</div>
      </button>
    );
  }

  return (
    <div className="screen">
      <BackBar
        title={person.name}
        sub={theirLoans.length === 1 ? '1 loan' : `${theirLoans.length} separate loans`}
        fallback="/people"
      />
      <section>
        <div className="section-label">
          ACTIVE LOANS <span className="count">{activeLoans.length}</span>
        </div>
        <Rows empty="No active loans.">{activeLoans.map(renderLoan)}</Rows>
        {theirLoans.length > 1 && (
          <NoteCard>
            Kept separate on purpose — each loan has its own rate, dates and history, the way it's written in
            the paper ledger.
          </NoteCard>
        )}

        {closedLoans.length > 0 && (
          <>
            <div className="section-label">
              CLOSED LOANS <span className="count">{closedLoans.length}</span>
            </div>
            <Rows empty="No closed loans.">{closedLoans.map(renderLoan)}</Rows>
          </>
        )}
      </section>
    </div>
  );
}
