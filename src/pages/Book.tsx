import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../data/DataContext';
import { TopBar } from '../components/TopBar';
import { SegmentedControl } from '../components/SegmentedControl';
import { SummaryStrip } from '../components/SummaryStrip';
import { TxnRow } from '../components/TxnRow';
import { dayTransactions, monthTransactions, periodTotals, yearMonthBreakdown } from '../lib/derive';
import { addDays, addMonths, formatINR, todayISO } from '../lib/format';

type Period = 'day' | 'month' | 'year';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function Book() {
  const { transactions } = useData();
  const navigate = useNavigate();
  const today = todayISO();

  const [period, setPeriod] = useState<Period>('day');
  const [currentDate, setCurrentDate] = useState(today);
  const [showPicker, setShowPicker] = useState(false);

  const [year, month] = currentDate.split('-').map(Number);

  function shiftDay(delta: number) {
    setCurrentDate(addDays(currentDate, delta));
  }

  function shiftMonth(delta: number) {
    setCurrentDate(addMonths(currentDate, delta));
  }

  function shiftYear(delta: number) {
    setCurrentDate(addMonths(currentDate, delta * 12));
  }

  const dayLabel = useMemo(() => {
    const isToday = currentDate === today;
    const d = new Date(currentDate + 'T00:00:00');
    const label = d
      .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      .toUpperCase();
    return isToday ? `${label} · TODAY` : label;
  }, [currentDate, today]);

  const dayTxns = dayTransactions(transactions, currentDate);
  const dayTotals = periodTotals(dayTxns);

  const monthTxns = monthTransactions(transactions, year, month).sort((a, b) => b.date.localeCompare(a.date));
  const monthTotals = periodTotals(monthTxns);

  const yearBreakdown = yearMonthBreakdown(transactions, year).filter((m) => m.credit > 0 || m.debit > 0);
  const yearTotal = yearBreakdown.reduce((sum, m) => sum + m.debit, 0);

  return (
    <div className="screen">
      <TopBar kicker="HOUSEHOLD LEDGER" title="Credit & debit book" />

      <div style={{ padding: '0 20px' }}>
        <SegmentedControl
          options={[
            { value: 'day', label: 'Day' },
            { value: 'month', label: 'Month' },
            { value: 'year', label: 'Year' },
          ]}
          value={period}
          onChange={setPeriod}
        />
      </div>

      {period === 'day' && (
        <>
          <div className="dateNav">
            <button className="navarrow" onClick={() => shiftDay(-1)}>&#8249;</button>
            <button className="daylabel" onClick={() => setShowPicker((s) => !s)}>
              <span>{dayLabel}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="13" height="13" style={{ opacity: 0.55 }}>
                <path d="M4 20l4.5-1 11-11-3.5-3.5-11 11z" />
              </svg>
            </button>
            <button className="navarrow" onClick={() => shiftDay(1)}>&#8250;</button>
          </div>
          {showPicker && (
            <input
              type="date"
              className="date-picker-input"
              value={currentDate}
              onChange={(e) => {
                setCurrentDate(e.target.value);
                setShowPicker(false);
              }}
            />
          )}
          <SummaryStrip
            cells={[
              { num: formatINR(dayTotals.credit), lbl: 'credit', color: 'var(--green)' },
              { num: formatINR(dayTotals.debit), lbl: 'debit', color: 'var(--maroon)' },
            ]}
          />
          <section>
            <div className="section-label">ENTRIES</div>
            {dayTxns.length === 0 ? (
              <div className="empty-row">No entries logged for this day.</div>
            ) : (
              <div className="rows">
                {dayTxns.map((t) => (
                  <TxnRow key={t.id} txn={t} showDate={false} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {period === 'month' && (
        <>
          <div className="dateNav">
            <button className="navarrow" onClick={() => shiftMonth(-1)}>&#8249;</button>
            <div className="daylabel">
              {MONTH_NAMES[month - 1]} {year}
            </div>
            <button className="navarrow" onClick={() => shiftMonth(1)}>&#8250;</button>
          </div>
          <SummaryStrip
            cells={[
              { num: formatINR(monthTotals.credit), lbl: `credit (${MONTH_NAMES[month - 1].slice(0, 3)})`, color: 'var(--green)' },
              { num: formatINR(monthTotals.debit), lbl: `debit (${MONTH_NAMES[month - 1].slice(0, 3)})`, color: 'var(--maroon)' },
            ]}
          />
          <section>
            <div className="section-label">{MONTH_NAMES[month - 1].toUpperCase()} {year}</div>
            {monthTxns.length === 0 ? (
              <div className="empty-row">No entries logged this month.</div>
            ) : (
              <div className="rows">
                {monthTxns.map((t) => (
                  <TxnRow key={t.id} txn={t} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {period === 'year' && (
        <>
          <div className="dateNav">
            <button className="navarrow" onClick={() => shiftYear(-1)}>&#8249;</button>
            <div className="daylabel">{year}</div>
            <button className="navarrow" onClick={() => shiftYear(1)}>&#8250;</button>
          </div>
          <div className="summary">
            <div className="cell" style={{ flex: 1 }}>
              <div className="num" style={{ color: 'var(--maroon)' }}>{formatINR(yearTotal)}</div>
              <div className="lbl">total expenses · {year} so far</div>
            </div>
          </div>
          <section>
            <div className="section-label">MONTH BY MONTH</div>
            {yearBreakdown.length === 0 ? (
              <div className="empty-row">No entries logged this year.</div>
            ) : (
              <div className="rows">
                {yearBreakdown.map((m) => (
                  <div className="row static" key={m.month}>
                    <div className="left">
                      <div className="name">{MONTH_NAMES[m.month - 1]}</div>
                    </div>
                    <div className="amt neutral">{formatINR(m.debit)}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <div className="actions">
        <button className="btn primary" onClick={() => navigate('/expenses/new')}>
          + Log expense
        </button>
      </div>
    </div>
  );
}
