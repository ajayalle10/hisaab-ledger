import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../data/DataContext';
import { TopBar } from '../components/TopBar';
import { SegmentedControl } from '../components/SegmentedControl';
import { SummaryStrip } from '../components/SummaryStrip';
import { Rows } from '../components/Row';
import { homeAgenda, periodLoanStats } from '../lib/derive';
import { formatINR, formatKicker, daysBetween, todayISO } from '../lib/format';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function Home() {
  const { loans, payments, personNameById } = useData();
  const navigate = useNavigate();
  const today = todayISO();

  const agenda = homeAgenda(loans, payments, personNameById, today);

  // Month/year being viewed in the "received" strip. Kept as plain numbers rather
  // than a Date so stepping months never drifts across time zones or month ends.
  const [period, setPeriod] = useState<'month' | 'year'>('month');
  const [viewYear, setViewYear] = useState(Number(today.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState(Number(today.slice(5, 7))); // 1–12

  function shift(delta: number) {
    if (period === 'year') {
      setViewYear((y) => y + delta);
      return;
    }
    const index = viewYear * 12 + (viewMonth - 1) + delta;
    setViewYear(Math.floor(index / 12));
    setViewMonth((index % 12) + 1);
  }

  const periodPrefix =
    period === 'month' ? `${viewYear}-${String(viewMonth).padStart(2, '0')}` : String(viewYear);
  const periodLabel = period === 'month' ? `${MONTH_NAMES[viewMonth - 1]} ${viewYear}` : String(viewYear);
  const stats = periodLoanStats(loans, payments, periodPrefix);

  return (
    <div className="screen">
      <TopBar kicker={formatKicker()} />

      <div style={{ padding: '4px 20px 0' }}>
        <SegmentedControl
          options={[
            { value: 'month', label: 'Month' },
            { value: 'year', label: 'Year' },
          ]}
          value={period}
          onChange={setPeriod}
        />
      </div>
      <div className="dateNav">
        <button className="navarrow" onClick={() => shift(-1)}>&#8249;</button>
        <div className="daylabel">{periodLabel}</div>
        <button className="navarrow" onClick={() => shift(1)}>&#8250;</button>
      </div>
      <SummaryStrip
        cells={[
          { num: formatINR(stats.interestReceived), lbl: 'interest received', color: 'var(--green)' },
          { num: formatINR(stats.principalReceived), lbl: 'principal received', color: 'var(--green)' },
          {
            num: String(stats.newLoanCount),
            lbl: stats.newLoanCount === 1 ? 'new loan' : 'new loans',
            sub: stats.newLoanCount > 0 ? formatINR(stats.newLoanAmount) : undefined,
          },
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
