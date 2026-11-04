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
 * Returns UTC Date objects for the start and end of a given calendar day in store timezone.
 */
export function getStoreDayRange(year: number, month: number, day: number): { startDate: Date; endDate: Date } {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const startIso = `${year}-${pad(month)}-${pad(day)}T00:00:00+05:30`;
  const startDate = new Date(startIso);
  const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
  return { startDate, endDate };
}

/**
 * Returns UTC Date objects for the start and end of today in store timezone (00:00:00 to 23:59:59.999).
 */
export function getStoreTodayRange(): { startDate: Date; endDate: Date } {
  const now = getStoreNow();
  return getStoreDayRange(now.year, now.month, now.day);
}

/**
 * Returns UTC Date objects for the start and end of yesterday in store timezone.
 */
export function getStoreYesterdayRange(): { startDate: Date; endDate: Date } {
  const todayRange = getStoreTodayRange();
  const startDate = new Date(todayRange.startDate.getTime() - 24 * 60 * 60 * 1000);
  const endDate = todayRange.startDate;
  return { startDate, endDate };
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

export interface ProductFilterRangeResult {
  startDate?: Date;
  endDate?: Date;
  label: string;
  periodKey: string;
}

/**
 * Computes exact start and end dates in store timezone for product performance filters.
 */
export function getProductFilterDateRange(params: {
  period?: string;
  month?: string;
  from?: string;
  to?: string;
}): ProductFilterRangeResult {
  const period = params.period?.toLowerCase();
  const month = params.month;
  const from = params.from;
  const to = params.to;

  // Custom date range: from and to provided (YYYY-MM-DD)
  if (from && to) {
    const startDate = new Date(`${from}T00:00:00+05:30`);
    const endDate = new Date(new Date(`${to}T00:00:00+05:30`).getTime() + 24 * 60 * 60 * 1000);
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      return {
        startDate,
        endDate,
        label: `${formatStoreDate(startDate)} – ${formatStoreDate(new Date(endDate.getTime() - 1000))}`,
        periodKey: 'custom',
      };
    }
  } else if (from) {
    const startDate = new Date(`${from}T00:00:00+05:30`);
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      return {
        startDate,
        endDate,
        label: formatStoreDate(startDate),
        periodKey: 'custom',
      };
    }
  }

  // Specific month: YYYY-MM
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [year, monthNum] = month.split('-').map(Number);
    if (year >= 2000 && monthNum >= 1 && monthNum <= 12) {
      const { startDate, endDate } = getStoreMonthRange(year, monthNum);
      const dateObj = new Date(year, monthNum - 1, 1);
      const monthLabel = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return {
        startDate,
        endDate,
        label: monthLabel,
        periodKey: month,
      };
    }
  }

  const now = getStoreNow();
  const todayRange = getStoreTodayRange();

  switch (period) {
    case 'today':
    case 'daily':
      return {
        startDate: todayRange.startDate,
        endDate: todayRange.endDate,
        label: `Today (${formatStoreDate(todayRange.startDate)})`,
        periodKey: 'today',
      };

    case 'yesterday': {
      const yRange = getStoreYesterdayRange();
      return {
        startDate: yRange.startDate,
        endDate: yRange.endDate,
        label: `Yesterday (${formatStoreDate(yRange.startDate)})`,
        periodKey: 'yesterday',
      };
    }

    case '7d': {
      const startDate = new Date(todayRange.startDate.getTime() - 6 * 24 * 60 * 60 * 1000);
      return {
        startDate,
        endDate: todayRange.endDate,
        label: `Last 7 Days (${formatStoreDate(startDate)} – ${formatStoreDate(new Date(todayRange.endDate.getTime() - 1000))})`,
        periodKey: '7d',
      };
    }

    case 'this_month':
    case 'monthly': {
      const { startDate, endDate } = getStoreMonthRange(now.year, now.month);
      const dateObj = new Date(now.year, now.month - 1, 1);
      const monthName = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return {
        startDate,
        endDate,
        label: `This Month (${monthName})`,
        periodKey: 'this_month',
      };
    }

    case 'last_month': {
      let prevMonth = now.month - 1;
      let prevYear = now.year;
      if (prevMonth < 1) {
        prevMonth = 12;
        prevYear -= 1;
      }
      const { startDate, endDate } = getStoreMonthRange(prevYear, prevMonth);
      const dateObj = new Date(prevYear, prevMonth - 1, 1);
      const monthName = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return {
        startDate,
        endDate,
        label: `Last Month (${monthName})`,
        periodKey: 'last_month',
      };
    }

    case '30d': {
      const startDate = new Date(todayRange.startDate.getTime() - 29 * 24 * 60 * 60 * 1000);
      return {
        startDate,
        endDate: todayRange.endDate,
        label: `Last 30 Days (${formatStoreDate(startDate)} – ${formatStoreDate(new Date(todayRange.endDate.getTime() - 1000))})`,
        periodKey: '30d',
      };
    }

    case '90d': {
      const startDate = new Date(todayRange.startDate.getTime() - 89 * 24 * 60 * 60 * 1000);
      return {
        startDate,
        endDate: todayRange.endDate,
        label: `Last 90 Days (${formatStoreDate(startDate)} – ${formatStoreDate(new Date(todayRange.endDate.getTime() - 1000))})`,
        periodKey: '90d',
      };
    }

    case 'all':
    default:
      return {
        label: 'All Time',
        periodKey: 'all',
      };
  }
}

export interface HourlyDataPoint {
  hour: number;
  label: string;
  timeRange: string;
  revenue: number;
  ordersCount: number;
  day?: string;
}

/**
 * Formats a 0-23 hour number into 12-hour format (e.g. 0 -> '12 AM', 13 -> '1 PM').
 */
export function formatStoreHour(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

/**
 * Returns the hour of the day (0-23) in store timezone (Asia/Kolkata).
 */
export function getStoreHour(date?: Date | string | number | null): number {
  const d = date ? (typeof date === 'string' || typeof date === 'number' ? new Date(date) : date) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: STORE_TIMEZONE,
    hour: 'numeric',
    hourCycle: 'h23',
  });
  const val = parseInt(formatter.format(validDate), 10);
  return isNaN(val) ? 0 : val;
}

/**
 * Computes 24 hourly buckets (00:00 to 23:00) in store timezone for a given calendar day.
 */
export function computeDayHourlyBuckets(
  orderPoints: Array<{ createdAt: string; revenue: number }>,
  targetYear: number,
  targetMonth: number,
  targetDay: number
): HourlyDataPoint[] {
  const hourFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: STORE_TIMEZONE,
    hour: 'numeric',
    hourCycle: 'h23',
  });

  const datePartsFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: STORE_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  const buckets: HourlyDataPoint[] = Array.from({ length: 24 }, (_, h) => {
    const nextH = (h + 1) % 24;
    const hourLabel = formatStoreHour(h);
    return {
      hour: h,
      label: hourLabel,
      timeRange: `${pad(h)}:00 – ${pad(nextH)}:00 (${hourLabel})`,
      revenue: 0,
      ordersCount: 0,
      day: hourLabel,
    };
  });

  for (const o of orderPoints) {
    if (!o.createdAt) continue;
    const d = new Date(o.createdAt);
    if (isNaN(d.getTime())) continue;

    const parts = datePartsFormatter.formatToParts(d);
    const yr = parseInt(parts.find((p) => p.type === 'year')?.value || '0', 10);
    const mo = parseInt(parts.find((p) => p.type === 'month')?.value || '0', 10);
    const dy = parseInt(parts.find((p) => p.type === 'day')?.value || '0', 10);

    if (yr === targetYear && mo === targetMonth && dy === targetDay) {
      const hr = parseInt(hourFormatter.format(d), 10);
      if (hr >= 0 && hr < 24) {
        buckets[hr].revenue += o.revenue;
        buckets[hr].ordersCount += 1;
      }
    }
  }

  return buckets.map((b) => ({
    ...b,
    revenue: Math.round(b.revenue * 100) / 100,
  }));
}

/**
 * Computes 24 hourly buckets for the rolling past 24 hours in store timezone.
 */
export function computeLast24HoursBuckets(
  orderPoints: Array<{ createdAt: string; revenue: number }>,
  referenceDate?: Date
): HourlyDataPoint[] {
  const ref = referenceDate || new Date();
  const hourFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: STORE_TIMEZONE,
    hour: 'numeric',
    hourCycle: 'h23',
  });
  const datePartsFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: STORE_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const refMs = ref.getTime();

  // Create slot map for the 24 hours
  const slotMap = new Map<string, number>();
  const buckets: HourlyDataPoint[] = [];

  for (let i = 23; i >= 0; i--) {
    const slotDate = new Date(refMs - i * 60 * 60 * 1000);
    const parts = datePartsFormatter.formatToParts(slotDate);
    const yr = parseInt(parts.find((p) => p.type === 'year')?.value || '0', 10);
    const mo = parseInt(parts.find((p) => p.type === 'month')?.value || '0', 10);
    const dy = parseInt(parts.find((p) => p.type === 'day')?.value || '0', 10);
    const hr = parseInt(hourFormatter.format(slotDate), 10);

    const key = `${yr}-${mo}-${dy}-${hr}`;
    const nextH = (hr + 1) % 24;
    const hourLabel = formatStoreHour(hr);
    const isCurrent = i === 0;

    const index = buckets.length;
    slotMap.set(key, index);

    buckets.push({
      hour: hr,
      label: isCurrent ? `${hourLabel} (Now)` : hourLabel,
      timeRange: `${pad(hr)}:00 – ${pad(nextH)}:00 (${dy}/${mo})`,
      revenue: 0,
      ordersCount: 0,
      day: hourLabel,
    });
  }

  for (const o of orderPoints) {
    if (!o.createdAt) continue;
    const d = new Date(o.createdAt);
    if (isNaN(d.getTime())) continue;

    const parts = datePartsFormatter.formatToParts(d);
    const yr = parseInt(parts.find((p) => p.type === 'year')?.value || '0', 10);
    const mo = parseInt(parts.find((p) => p.type === 'month')?.value || '0', 10);
    const dy = parseInt(parts.find((p) => p.type === 'day')?.value || '0', 10);
    const hr = parseInt(hourFormatter.format(d), 10);

    const key = `${yr}-${mo}-${dy}-${hr}`;
    const idx = slotMap.get(key);
    if (idx !== undefined) {
      buckets[idx].revenue += o.revenue;
      buckets[idx].ordersCount += 1;
    }
  }

  return buckets.map((b) => ({
    ...b,
    revenue: Math.round(b.revenue * 100) / 100,
  }));
}

