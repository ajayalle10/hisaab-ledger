import { useNavigate } from 'react-router-dom';
import { useData } from '../data/DataContext';
import { TopBar } from '../components/TopBar';
import { Rows } from '../components/Row';
import { personSummary } from '../lib/derive';
import { formatINR } from '../lib/format';

export function People() {
  const { people, loans, payments } = useData();
  const navigate = useNavigate();

  return (
    <div className="screen">
      <TopBar kicker={`${people.length} PEOPLE`} title="People" />
      <section>
        <Rows empty="No people yet.">
          {people.map((person) => {
            const summary = personSummary(person.id, loans, payments);
            const isTaken = summary.takenOutstanding > 0 && summary.givenOutstanding === 0;
            const amount = isTaken ? summary.takenOutstanding : summary.givenOutstanding;
            const metaParts = [`${summary.loanCount} loan${summary.loanCount === 1 ? '' : 's'} open`];
            if (isTaken) metaParts.push('money taken from them');
            if (summary.hasOverdue) metaParts.push('overdue promise');
            return (
              <button key={person.id} className="row" onClick={() => navigate(`/people/${person.id}`)}>
                <div className="left">
                  <div className="name">{person.name}</div>
                  <div className="meta">{metaParts.join(' · ')}</div>
                </div>
                <div className={`amt ${isTaken ? 'taken' : 'given'}`}>{formatINR(amount)} &#8594;</div>
              </button>
            );
          })}
        </Rows>
      </section>
      <div className="actions">
        <button className="btn primary" onClick={() => navigate('/loans/new')}>
          + New loan
        </button>
      </div>
    </div>
  );
}
