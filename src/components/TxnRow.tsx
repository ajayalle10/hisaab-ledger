import type { Transaction } from '../types';
import { formatDate, formatSignedINR } from '../lib/format';

export function TxnRow({ txn, showDate = true }: { txn: Transaction; showDate?: boolean }) {
  const signedAmount = txn.type === 'debit' ? -txn.amount : txn.amount;
  return (
    <div className="txn-row">
      <div className="desc">
        <div className="t">{txn.title || txn.category}</div>
        <div className="s">
          {showDate && `${formatDate(txn.date)} · `}
          {txn.category} <span className="mode-pill">{txn.paymentMode.toUpperCase()}</span>
        </div>
      </div>
      <div className="amt" style={{ color: txn.type === 'debit' ? 'var(--maroon)' : 'var(--green)' }}>
        {formatSignedINR(signedAmount)}
      </div>
    </div>
  );
}
