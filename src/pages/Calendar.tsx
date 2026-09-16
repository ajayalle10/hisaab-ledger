import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../data/DataContext';
import { TopBar } from '../components/TopBar';
import { activityDaysInMonth, homeAgenda, isOverdue } from '../lib/derive';
import { daysBetween, formatDate, formatINR, todayISO } from '../lib/format';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function Calendar() {
  const { loans, payments, transactions, personNameById } = useData();
  const navigate = useNavigate();
  const today = todayISO();
  const now = new Date(today + 'T00:00:00');

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-indexed

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setMonth(m);
    setYear(y);
  }

  const activityDays = useMemo(
    () => activityDaysInMonth(year, month, loans, payments, transactions),
    [year, month, loans, payments, transactions],
  );

  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const todayDate = now.getDate();

  const overdueLoans = loans.filter((l) => isOverdue(l, today));
  const upcoming = homeAgenda(loans, payments, personNameById, today, 30).filter((i) => i.kind === 'reminder');

  return (
    <div className="screen">
      <TopBar kicker={`${MONTH_NAMES[month - 1].toUpperCase()} ${year}`} title="Calendar" />

      <div className="dateNav">
        <button className="navarrow" onClick={() => shiftMonth(-1)}>&#8249;</button>
        <div className="daylabel">
          {MONTH_NAMES[month - 1]} {year}
        </div>
        <button className="navarrow" onClick={() => shiftMonth(1)}>&#8250;</button>
      </div>

      <div className="cal-grid">
        {DOW.map((d, i) => (
          <div className="dow" key={`dow-${i}`}>{d}</div>
        ))}
        {Array.from({ length: firstDow }).map((_, i) => (
          <div className="cal-day blank" key={`blank-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isToday = isCurrentMonth && day === todayDate;
          const hasActivity = activityDays.has(day);
          return (
            <div className={`cal-day${isToday ? ' today' : ''}`} key={day}>
              {day}
              {hasActivity && <span className="dot" />}
            </div>
          );
        })}
      </div>

      <section>
        <div className="section-label">UPCOMING</div>
        {overdueLoans.map((loan) => (
          <div
            className="agenda-item"
            key={loan.id}
            onClick={() => navigate(`/loans/${loan.id}`)}
          >
            <div className="date">PAST</div>
            <div className="desc">
              <div className="t" style={{ color: 'var(--maroon)' }}>
                {personNameById[loan.personId]} — promise overdue
              </div>
              <div className="s">
                Was due {formatDate(loan.promisedReturnDate!)}, {daysBetween(loan.promisedReturnDate!, today)} days late
              </div>
            </div>
          </div>
        ))}
        {upcoming.map((item) =>
          item.kind === 'reminder' ? (
            <div className="agenda-item" key={item.loan.id} onClick={() => navigate(`/loans/${item.loan.id}`)}>
              <div className="date">{formatDate(item.dueDate).slice(0, 6).toUpperCase()}</div>
              <div className="desc">
                <div className="t">{item.personName} — interest reminder</div>
                <div className="s">{formatINR(item.amount)} expected</div>
              </div>
            </div>
          ) : null,
        )}
        {overdueLoans.length === 0 && upcoming.length === 0 && (
          <div className="empty-row">Nothing upcoming.</div>
        )}
      </section>
    </div>
  );
}
