import { useNavigate } from 'react-router-dom';
import { useData } from '../data/DataContext';
import { TopBar } from '../components/TopBar';
import { SummaryStrip } from '../components/SummaryStrip';
import { Rows } from '../components/Row';
import { homeAgenda, homeTotals } from '../lib/derive';
import { formatINR, formatKicker, daysBetween, todayISO } from '../lib/format';

export function Home() {
  const { loans, payments, personNameById } = useData();
  const navigate = useNavigate();
  const today = todayISO();

  const totals = homeTotals(loans, payments);
  const agenda = homeAgenda(loans, payments, personNameById, today);

  return (
    <div className="screen">
      <TopBar kicker={formatKicker()} />

      <SummaryStrip
        cells={[
          { num: formatINR(totals.givenOutstanding), lbl: 'given out', color: 'var(--maroon)' },
          { num: formatINR(totals.takenOutstanding), lbl: 'taken', color: 'var(--green)' },
          { num: String(totals.peopleCount), lbl: 'people' },
        ]}
      />

      <section>
        <div className="section-label">
          TODAY &amp; THIS WEEK <span className="count">{agenda.length}</span>
        </div>
        <Rows empty="Nothing due this week.">
          {agenda.map((item) => (
            <button
              key={`${item.kind}-${item.loan.id}`}
              className="row"
              onClick={() => navigate(`/loans/${item.loan.id}`)}
            >
              <div className="left">
                <div className="name">{item.personName}</div>
                <div className="meta">
                  {item.kind === 'overdue'
                    ? `Promised return — ${daysBetween(item.dueDate, today)} days overdue`
                    : `Interest reminder — due in ${item.daysUntil} day${item.daysUntil === 1 ? '' : 's'}`}
                </div>
                <span className={`flag ${item.kind === 'overdue' ? 'overdue' : 'pending'}`}>
                  {item.kind === 'overdue' ? 'OVERDUE' : 'UPCOMING'}
                </span>
              </div>
              <div className="amt given">{formatINR(item.amount)}</div>
            </button>
          ))}
        </Rows>
      </section>

      <div className="actions">
        <button className="btn primary" onClick={() => navigate('/loans/new')}>
          + New loan
        </button>
        <button className="btn" onClick={() => navigate('/payments/new')}>
          Log payment
        </button>
      </div>
    </div>
  );
}
