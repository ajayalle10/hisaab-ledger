import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../data/DataContext';
import { BackBar } from '../components/BackBar';
import { Field } from '../components/Field';
import { SegmentedControl } from '../components/SegmentedControl';
import { PAYMENT_MODES, TRANSACTION_CATEGORIES } from '../lib/constants';
import { todayISO } from '../lib/format';
import type { PaymentMode, TransactionCategory, TransactionType } from '../types';

export function AddExpense() {
  const { addTransaction } = useData();
  const navigate = useNavigate();

  const [type, setType] = useState<TransactionType>('debit');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [category, setCategory] = useState<TransactionCategory>('Household');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = title.trim() && Number(amount) > 0 && date;

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    setError(null);
    try {
      await addTransaction({
        type,
        title: title.trim(),
        amount: Number(amount),
        date,
        category,
        paymentMode,
        notes: notes.trim() || undefined,
      });
      navigate('/book');
    } catch {
      setError('Could not save this entry. Please try again.');
      setSaving(false);
    }
  }

  return (
    <div className="screen">
      <BackBar title="Log expense" sub="Goes straight into the credit/debit book" fallback="/book" />
      <section>
        <Field label="Type">
          <SegmentedControl
            options={[
              { value: 'credit', label: 'Credit — money in' },
              { value: 'debit', label: 'Debit — money out' },
            ]}
            value={type}
            onChange={setType}
          />
        </Field>
        <Field label={type === 'credit' ? 'Name' : 'Title'}>
          <input
            type="text"
            placeholder={type === 'credit' ? 'e.g. Priya Nair' : 'e.g. Grocery'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <Field label="Amount">
          <input type="number" inputMode="decimal" placeholder="₹" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Date">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Category">
          <select value={category} onChange={(e) => setCategory(e.target.value as TransactionCategory)}>
            {TRANSACTION_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Payment mode">
          <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}>
            {PAYMENT_MODES.map((mode) => (
              <option key={mode} value={mode}>{mode}</option>
            ))}
          </select>
        </Field>
        <Field label="Notes — optional">
          <textarea placeholder="What was this for..." value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </section>
      {error && (
        <section style={{ paddingTop: 0 }}>
          <div style={{ color: 'var(--maroon)', fontSize: '0.82rem' }}>{error}</div>
        </section>
      )}
      <div className="actions">
        <button className="btn primary" disabled={!isValid || saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save entry'}
        </button>
      </div>
    </div>
  );
}
