/**
 * Store timezone and calendar utilities.
 * The Shopify store operates in Indian Standard Time (IST, Asia/Kolkata, UTC+05:30).
 * All 24-hour daily orders and monthly calculations must align with this timezone.
 */

export const STORE_TIMEZONE = 'Asia/Kolkata';

export interface StoreDateParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  dateStr: string; // YYYY-MM-DD
}

/**
 * Returns year, month (1-12), and day (1-31) in the store timezone (Asia/Kolkata).
 */
export function getStoreDateParts(date?: Date | string | number | null): StoreDateParts {
  const d = date ? (typeof date === 'string' || typeof date === 'number' ? new Date(date) : date) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: STORE_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  const parts = formatter.formatToParts(validDate);
  const year = parseInt(parts.find((p) => p.type === 'year')?.value || '1970', 10);
  const month = parseInt(parts.find((p) => p.type === 'month')?.value || '1', 10);
  const day = parseInt(parts.find((p) => p.type === 'day')?.value || '1', 10);

  const paddedMonth = month < 10 ? `0${month}` : `${month}`;
  const paddedDay = day < 10 ? `0${day}` : `${day}`;

  return {
    year,
    month,
    day,
    dateStr: `${year}-${paddedMonth}-${paddedDay}`,
  };
}

/**
 * Extracts the calendar day (1-31) in the store timezone for grouping into daily charts.
 */
export function getStoreDay(date: Date | string | number | null | undefined): number {
  if (!date) return 0;
  return getStoreDateParts(date).day;
}

/**
 * Returns UTC Date objects for the start and end of a given month in store timezone.
 * Month is 1-indexed (1 = Jan, 10 = Oct, 12 = Dec).
 * e.g. for Oct 2026:
 *  - startDate: 2026-10-01 00:00:00 IST (2026-09-30T18:30:00.000Z UTC)
 *  - endDate:   2026-11-01 00:00:00 IST (2026-10-31T18:30:00.000Z UTC)
 */
export function getStoreMonthRange(year: number, month: number): { startDate: Date; endDate: Date } {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const startIso = `${year}-${pad(month)}-01T00:00:00+05:30`;

  let nextYear = year;
  let nextMonth = month + 1;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }
  const endIso = `${nextYear}-${pad(nextMonth)}-01T00:00:00+05:30`;

  return {
    startDate: new Date(startIso),
    endDate: new Date(endIso),
  };
}

/**
 * Returns the current date parts in store timezone.
 */
export function getStoreNow(): StoreDateParts {
  return getStoreDateParts(new Date());
}

/**
 * Formats a date for display in the store's timezone.
 */
export function formatStoreDate(
  date: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', { ...options, timeZone: STORE_TIMEZONE });
}

/**
 * Formats a time for display in the store's timezone.
 */
export function formatStoreTime(
  date: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true }
): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { ...options, timeZone: STORE_TIMEZONE });
}
