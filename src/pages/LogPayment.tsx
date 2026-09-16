import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../data/DataContext';
import { BackBar } from '../components/BackBar';
import { Field } from '../components/Field';
import { PAYMENT_MODES } from '../lib/constants';
import { formatDate, formatINR, todayISO } from '../lib/format';
import type { PaymentMode } from '../types';

export function LogPayment() {
  const { loans, getPerson, addPayment } = useData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetLoanId = searchParams.get('loanId') ?? '';

  const activeLoans = loans.filter((l) => l.status === 'active');

  const [loanId, setLoanId] = useState(presetLoanId || activeLoans[0]?.id || '');
  const [totalAmount, setTotalAmount] = useState('');
  const [interestPortion, setInterestPortion] = useState('');
  const [principalPortion, setPrincipalPortion] = useState('');
  const [date, setDate] = useState(todayISO());
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = loanId && Number(totalAmount) > 0 && date;

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    setError(null);
    try {
      await addPayment({
        loanId,
        date,
        totalAmount: Number(totalAmount),
        interestPortion: Number(interestPortion) || 0,
        principalPortion: Number(principalPortion) || 0,
        paymentMode,
        notes: notes.trim() || undefined,
      });
      navigate('/');
    } catch {
      setError('Could not save this payment. Please try again.');
      setSaving(false);
    }
  }

  return (
    <div className="screen">
      <BackBar title="Log payment" sub="You decide how it splits" fallback="/" />
      <section>
        <Field label="Loan">
          <select value={loanId} onChange={(e) => setLoanId(e.target.value)}>
            {activeLoans.map((loan) => {
              const person = getPerson(loan.personId);
              return (
                <option key={loan.id} value={loan.id}>
                  {person?.name} — {formatINR(loan.principal)} ({formatDate(loan.dateGiven)})
                </option>
              );
            })}
          </select>
        </Field>
        <Field label="Total amount received">
          <input
            type="number"
            inputMode="decimal"
            placeholder="₹"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
          />
        </Field>
        <Field label="— of which, interest">
          <input
            type="number"
            inputMode="decimal"
            placeholder="₹"
            value={interestPortion}
            onChange={(e) => setInterestPortion(e.target.value)}
          />
        </Field>
        <Field label="— of which, principal">
          <input
            type="number"
            inputMode="decimal"
            placeholder="₹ (reduces outstanding)"
            value={principalPortion}
            onChange={(e) => setPrincipalPortion(e.target.value)}
          />
        </Field>
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
          {saving ? 'Saving…' : 'Save payment'}
        </button>
      </div>
    </div>
  );
}
