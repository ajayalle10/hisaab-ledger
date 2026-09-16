import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NeedsNicknameError, useData } from '../data/DataContext';
import { BackBar } from '../components/BackBar';
import { Field } from '../components/Field';
import { SegmentedControl } from '../components/SegmentedControl';
import { Modal } from '../components/Modal';
import { PAYMENT_MODES } from '../lib/constants';
import { todayISO } from '../lib/format';
import type { Loan, PaymentMode } from '../types';

export function AddLoan() {
  const { findPersonByName, createLoan } = useData();
  const navigate = useNavigate();

  const [personName, setPersonName] = useState('');
  const [direction, setDirection] = useState<Loan['direction']>('given');
  const [principal, setPrincipal] = useState('');
  const [dateGiven, setDateGiven] = useState(todayISO());
  const [rate, setRate] = useState('');
  const [promisedReturnDate, setPromisedReturnDate] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [notes, setNotes] = useState('');

  const [pendingMatch, setPendingMatch] = useState<{ name: string; loanCount: number } | null>(null);
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isValid = personName.trim() && Number(principal) > 0 && dateGiven && rate !== '';

  async function commitLoan(nicknameValue?: string) {
    setSaving(true);
    setError(null);
    try {
      await createLoan({
        personName: personName.trim(),
        nickname: nicknameValue,
        direction,
        principal: Number(principal),
        dateGiven,
        interestRatePctPerMonth: Number(rate),
        promisedReturnDate: promisedReturnDate || undefined,
        paymentMode,
        notes: notes.trim() || undefined,
      });
      navigate('/');
    } catch (err) {
      if (err instanceof NeedsNicknameError) {
        setPendingMatch({ name: err.personName, loanCount: err.existingLoanCount });
        setNickname('');
      } else {
        setError('Could not save this loan. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  function handleSave() {
    if (!isValid) return;
    const match = findPersonByName(personName);
    if (match) {
      setPendingMatch({ name: match.person.name, loanCount: match.loanCount });
      setNickname('');
    } else {
      void commitLoan();
    }
  }

  function confirmWithNickname() {
    if (!nickname.trim()) return;
    void commitLoan(nickname.trim());
  }

  return (
    <div className="screen">
      <BackBar title="New loan" sub="Kept separate from any existing loans" fallback="/" />
      <section>
        <Field label="Person">
          <input
            type="text"
            placeholder="e.g. Vijay Kumar"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
          />
        </Field>
        <Field label="Direction">
          <SegmentedControl
            options={[
              { value: 'given', label: 'He owes us' },
              { value: 'taken', label: 'We owe him' },
            ]}
            value={direction}
            onChange={setDirection}
          />
        </Field>
        <Field label="Principal amount">
          <input
            type="number"
            inputMode="decimal"
            placeholder="₹"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
          />
        </Field>
        <Field label="Date given">
          <input type="date" value={dateGiven} onChange={(e) => setDateGiven(e.target.value)} />
        </Field>
        <Field label="Interest rate (per month)">
          <input
            type="number"
            inputMode="decimal"
            placeholder="e.g. 2"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </Field>
        <Field label="Promised return date — optional">
          <input
            type="date"
            value={promisedReturnDate}
            onChange={(e) => setPromisedReturnDate(e.target.value)}
          />
        </Field>
        <Field label="Payment mode">
          <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}>
            {PAYMENT_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Notes — optional">
          <textarea placeholder="Why, where, by whom..." value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </section>
      {error && !pendingMatch && (
        <section style={{ paddingTop: 0 }}>
          <div style={{ color: 'var(--maroon)', fontSize: '0.82rem' }}>{error}</div>
        </section>
      )}
      <div className="actions">
        <button className="btn primary" disabled={!isValid || saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save loan'}
        </button>
      </div>

      {pendingMatch && (
        <Modal
          title="Same person, another loan"
          body={
            <>
              <strong>{pendingMatch.name}</strong> already has {pendingMatch.loanCount} loan
              {pendingMatch.loanCount > 1 ? 's' : ''} on file. This new one will go under the same person —
              just give it a short name so it's easy to pick out on the list.
            </>
          }
          actions={
            <>
              <button className="btn" onClick={() => setPendingMatch(null)} disabled={saving}>
                Cancel
              </button>
              <button className="btn primary" disabled={!nickname.trim() || saving} onClick={confirmWithNickname}>
                {saving ? 'Saving…' : 'Save loan'}
              </button>
            </>
          }
        >
          <Field label="Short name for this loan">
            <input
              type="text"
              placeholder="e.g. VK-10L"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              autoFocus
            />
          </Field>
          {error && <div style={{ color: 'var(--maroon)', fontSize: '0.82rem', marginTop: -8 }}>{error}</div>}
        </Modal>
      )}
    </div>
  );
}
