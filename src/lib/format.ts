export function formatINR(amount: number): string {
  return '₹' + new Intl.NumberFormat('en-IN').format(Math.round(Math.abs(amount)));
}

export function formatSignedINR(amount: number): string {
  const sign = amount < 0 ? '−' : '+';
  return sign + formatINR(amount);
}

// "10 Sep 2026"
export function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// "WED, 16 SEP 2026"
export function formatKicker(date: Date = new Date()): string {
  return date
    .toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    .toUpperCase()
    .replace(',', ',');
}

// "16 SEP 2026"
export function formatDateUpper(iso: string): string {
  return formatDate(iso).toUpperCase();
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addMonths(iso: string, months: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(fromISO: string, toISO: string): number {
  const from = new Date(fromISO + 'T00:00:00').getTime();
  const to = new Date(toISO + 'T00:00:00').getTime();
  return Math.round((to - from) / 86400000);
}
