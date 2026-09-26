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

// "YYYY-MM-DD" in the phone's own time zone. Never use toISOString() for this:
// it converts to UTC, which in India (UTC+5:30) is still "yesterday" until 5:30 AM.
export function toLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toLocalISO(new Date());
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toLocalISO(d);
}

// Clamps to the target month's last day, so 31 Jan + 1 month = 28/29 Feb, not 3 Mar.
export function addMonths(iso: string, months: number): string {
  const [y, m, day] = iso.split('-').map(Number);
  const target = new Date(y, m - 1 + months, 1);
  const daysInTarget = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, daysInTarget));
  return toLocalISO(target);
}

export function daysBetween(fromISO: string, toISO: string): number {
  const from = new Date(fromISO + 'T00:00:00').getTime();
  const to = new Date(toISO + 'T00:00:00').getTime();
  return Math.round((to - from) / 86400000);
}
