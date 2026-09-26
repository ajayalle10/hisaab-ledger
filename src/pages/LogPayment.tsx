import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../data/DataContext';
import { BackBar } from '../components/BackBar';
import { Field } from '../components/Field';
import { SegmentedControl } from '../components/SegmentedControl';
import { PAYMENT_MODES } from '../lib/constants';
import { expectedInterestAmount, outstandingPrincipal } from '../lib/derive';
import { formatDate, formatINR, todayISO } from '../lib/format';
import type { PaymentMode } from '../types';

type PaymentType = 'interest' | 'principal' | 'both';

export function LogPayment() {
  const { loans, payments, getPerson, addPayment } = useData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetLoanId = searchParams.get('loanId') ?? '';

  const activeLoans = loans.filter((l) => l.status === 'active');

  const [loanId, setLoanId] = useState(presetLoanId || activeLoans[0]?.id || '');
  const [paymentType, setPaymentType] = useState<PaymentType>('interest');
  const [interestInput, setInterestInput] = useState('');
  const [principalInput, setPrincipalInput] = useState('');
  const [date, setDate] = useState(todayISO());
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loan = loans.find((l) => l.id === loanId);
  const outstanding = loan ? outstandingPrincipal(loan, payments) : 0;
  const expectedInterest = loan ? expectedInterestAmount(loan, payments) : 0;

  // Only the fields shown for the chosen type count — a value typed before
  // switching type is kept in the box but ignored, so it can't sneak into the total.
  const interestPortion = paymentType === 'principal' ? 0 : Number(interestInput) || 0;
  const principalPortion = paymentType === 'interest' ? 0 : Number(principalInput) || 0;
  const totalAmount = interestPortion + principalPortion;
  const principalTooHigh = principalPortion > outstanding;

  const isValid = loanId && totalAmount > 0 && interestPortion >= 0 && principalPortion >= 0 && date;

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    setError(null);
    try {
      await addPayment({
        loanId,
        date,
        totalAmount,
        interestPortion,
        principalPortion,
        paymentMode,
        notes: notes.trim() || undefined,
      });
      navigate('/');
    } catch {
      setError('Could not save this payment. Please try again.');
      setSaving(false);
    }
  }

  const interestField = (
    <Field label="Interest amount">
      <input
        type="number"
        inputMode="decimal"
        placeholder="₹"
        value={interestInput}
        onChange={(e) => setInterestInput(e.target.value)}
      />
      {loan && expectedInterest > 0 && (
        <button type="button" className="field-hint link" onClick={() => setInterestInput(String(expectedInterest))}>
          Expected {formatINR(expectedInterest)} ({loan.interestRatePctPerMonth}% of {formatINR(outstanding)}) — tap
          to fill
        </button>
      )}
    </Field>
  );

  const principalField = (
    <Field label="Principal amount">
      <input
        type="number"
        inputMode="decimal"
        placeholder="₹ (reduces outstanding)"
        value={principalInput}
        onChange={(e) => setPrincipalInput(e.target.value)}
      />
      {loan && (
        <div className="field-hint" style={principalTooHigh ? { color: 'var(--maroon)' } : undefined}>
          {principalTooHigh
            ? `More than the ${formatINR(outstanding)} still outstanding — check the amount`
            : `Outstanding: ${formatINR(outstanding)}`}
        </div>
      )}
    </Field>
  );

  return (
    <div className="screen">
      <BackBar title="Log payment" sub="Pick the type, the total adds up itself" fallback="/" />
      <section>
        <Field label="Loan">
          <select value={loanId} onChange={(e) => setLoanId(e.target.value)}>
            {activeLoans.map((l) => {
              const person = getPerson(l.personId);
              return (
                <option key={l.id} value={l.id}>
                  {person?.name} — {formatINR(l.principal)} ({formatDate(l.dateGiven)})
                </option>
              );
            })}
          </select>
        </Field>
        <Field label="Payment type">
          <SegmentedControl
            options={[
              { value: 'interest', label: 'Interest only' },
              { value: 'principal', label: 'Principal only' },
              { value: 'both', label: 'Both' },
            ]}
            value={paymentType}
            onChange={setPaymentType}
          />
        </Field>

        {paymentType !== 'principal' && interestField}
        {paymentType !== 'interest' && principalField}

        <div className="kf-row total-row">
          <span className="k">Total received</span>
          <span className="v">{formatINR(totalAmount)}</span>
        </div>

        <Field label="Date">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
          <textarea
            placeholder="Anything worth remembering..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
      </section>
      {error && (
        <section style={{ paddingTop: 0 }}>
          <div style={{ color: 'var(--maroon)', fontSize: '0.82rem' }}>{error}</div>
        </section>
      )}
      <div className="actions">
        <button className="btn primary" disabled={!isValid || saving} onClick={handleSave}>
          {saving ? 'Saving…' : `Save payment${totalAmount > 0 ? ' · ' + formatINR(totalAmount) : ''}`}
        </button>
      </div>
    </div>
  );
}
