'use client';

import { useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  CreditCard,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface DailyPlanItem {
  id: string;
  date: string; // 'YYYY-MM-DD'
  totalBudget: string;
  campaignCount: string;
  distributionMode: 'ALL_SAME' | 'DIFFERENT';
  campaigns: string;
  status: 'IN_PROGRESS' | 'DONE' | 'NOT_DONE';
  notes?: string | null;
}

export interface CalendarTransaction {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  dailyBudget?: string | number;
  calculatedWeeklyBudget?: string | number;
  amountPaid: string | number;
  paymentDate?: string;
  paymentMethodName?: string;
  paymentMethodCode?: string;
  status?: string;
  referenceNumber?: string | null;
  notes?: string | null;
}

interface MetaAdsCalendarProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  transactions?: CalendarTransaction[];
  plansMap?: Record<string, DailyPlanItem>;
  todayStr: string;
  canEdit?: boolean;
  onRecordPayment?: (startDate?: string, endDate?: string) => void;
  showDetailsPanel?: boolean;
}

export interface PeriodPayment {
  id: string;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string; // 'YYYY-MM-DD'
  daysCount: number;
  amountPaid: number;
  paymentDate?: string;
  paymentMethodName?: string;
  status: string;
  referenceNumber?: string | null;
  notes?: string | null;
  isSingleDay: boolean;
}

interface DayPaymentInfo {
  startingPayments: PeriodPayment[];
  endingPayments: PeriodPayment[];
  spanningPayments: PeriodPayment[];
  allPayments: PeriodPayment[];
  hasActivity: boolean;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Normalizes any Date or date string to YYYY-MM-DD
function normalizeDateStr(d: string | Date | undefined | null): string {
  if (!d) return '';
  if (typeof d === 'string') {
    if (d.includes('T')) return d.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return '';
    const year = parsed.getUTCFullYear();
    const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
    const day = String(parsed.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Calculate days between two YYYY-MM-DD dates inclusively
function getDaysCount(startStr: string, endStr: string): number {
  if (!startStr || !endStr) return 1;
  const [sy, sm, sd] = startStr.split('-').map(Number);
  const [ey, em, ed] = endStr.split('-').map(Number);
  if (!sy || !sm || !sd || !ey || !em || !ed) return 1;
  const utcStart = Date.UTC(sy, sm - 1, sd);
  const utcEnd = Date.UTC(ey, em - 1, ed);
  if (utcEnd < utcStart) return 1;
  const diff = Math.round((utcEnd - utcStart) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 1;
}

// Format 'YYYY-MM-DD' to short readable e.g. '2 Nov'
export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short'
  });
}

// Format 'YYYY-MM-DD' to full readable e.g. '2 Nov 2026'
export function formatFullDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export default function MetaAdsCalendar({
  currentMonth,
  onMonthChange,
  selectedDate,
  onSelectDate,
  transactions = [],
  plansMap = {},
  todayStr,
  canEdit = false,
  onRecordPayment,
  showDetailsPanel = false,
}: MetaAdsCalendarProps) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-indexed

  // Navigation handlers
  const handlePrevMonth = () => {
    onMonthChange(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(new Date(year, month + 1, 1));
  };

  const handleJumpToToday = () => {
    const today = new Date();
    onMonthChange(new Date(today.getFullYear(), today.getMonth(), 1));
    onSelectDate(todayStr);
  };

  // Calendar math (Monday as day 1)
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();

  // Day of week: 0 = Sun, 1 = Mon ... 6 = Sat -> Convert so 0 = Mon, 6 = Sun
  const firstDayIndex = (firstDayOfMonth.getDay() + 6) % 7;

  // Process all transactions into clean period payments
  const processedPayments = useMemo<PeriodPayment[]>(() => {
    return transactions
      .filter((tx) => !tx.status || tx.status === 'PAID')
      .map((tx) => {
        const start = normalizeDateStr(tx.weekStartDate);
        const end = normalizeDateStr(tx.weekEndDate);
        const daysCount = getDaysCount(start, end);
        const rawAmount = typeof tx.amountPaid === 'number' 
          ? tx.amountPaid 
          : parseFloat(String(tx.amountPaid).replace(/,/g, '') || '0');
        const amountPaid = isNaN(rawAmount) ? 0 : rawAmount;

        return {
          id: tx.id,
          startDate: start,
          endDate: end,
          daysCount,
          amountPaid,
          paymentDate: tx.paymentDate ? normalizeDateStr(tx.paymentDate) : undefined,
          paymentMethodName: tx.paymentMethodName,
          status: tx.status || 'PAID',
          referenceNumber: tx.referenceNumber,
          notes: tx.notes,
          isSingleDay: start === end,
        };
      })
      .filter((p) => Boolean(p.startDate && p.endDate));
  }, [transactions]);

  // Build a fast lookup map for every day
  const dayPaymentMap = useMemo(() => {
    const map: Record<string, DayPaymentInfo> = {};

    processedPayments.forEach((p) => {
      const [sy, sm, sd] = p.startDate.split('-').map(Number);
      for (let i = 0; i < p.daysCount; i++) {
        const d = new Date(Date.UTC(sy, sm - 1, sd + i));
        const dayStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

        if (!map[dayStr]) {
          map[dayStr] = {
            startingPayments: [],
            endingPayments: [],
            spanningPayments: [],
            allPayments: [],
            hasActivity: false,
          };
        }

        const isStart = dayStr === p.startDate;
        const isEnd = dayStr === p.endDate;

        if (isStart) {
          map[dayStr].startingPayments.push(p);
        } else if (isEnd) {
          map[dayStr].endingPayments.push(p);
        } else {
          map[dayStr].spanningPayments.push(p);
        }

        map[dayStr].allPayments.push(p);
        map[dayStr].hasActivity = true;
      }
    });

    return map;
  }, [processedPayments]);

  // Calculate stats for current displayed month
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const { 
    totalPaidInMonth, 
    paymentsInMonthCount,
    singleDayPaymentsCount,
    multiDayPaymentsCount,
    daysWithPaymentCount 
  } = useMemo(() => {
    let total = 0;
    let singleCount = 0;
    let multiCount = 0;
    let daysWithPayments = 0;

    // Payments whose period overlaps with the current month
    const seenTxIds = new Set<string>();

    processedPayments.forEach((p) => {
      // Overlaps with current month if startDate <= monthEnd && endDate >= monthStart
      const monthStartStr = `${monthPrefix}-01`;
      const monthEndStr = `${monthPrefix}-${String(daysInMonth).padStart(2, '0')}`;

      if (p.startDate <= monthEndStr && p.endDate >= monthStartStr) {
        if (!seenTxIds.has(p.id)) {
          seenTxIds.add(p.id);
          total += p.amountPaid;
          if (p.isSingleDay) {
            singleCount++;
          } else {
            multiCount++;
          }
        }
      }
    });

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${monthPrefix}-${String(day).padStart(2, '0')}`;
      if (dayPaymentMap[dayStr]?.hasActivity) {
        daysWithPayments++;
      }
    }

    return {
      totalPaidInMonth: total,
      paymentsInMonthCount: seenTxIds.size,
      singleDayPaymentsCount: singleCount,
      multiDayPaymentsCount: multiCount,
      daysWithPaymentCount: daysWithPayments,
    };
  }, [processedPayments, monthPrefix, daysInMonth, dayPaymentMap]);

  const monthLabel = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Selected date details
  const selectedDayInfo = dayPaymentMap[selectedDate];
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-').map(Number);
    if (!y || !m || !d) return selectedDate;
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }, [selectedDate]);

  // Generate calendar cells
  const calendarCells = [];

  // Padding for previous month
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(
      <div
        key={`empty-${i}`}
        className="min-h-[76px] sm:min-h-[88px] md:min-h-[96px] rounded-xl bg-muted/20 border border-border/40 opacity-20 pointer-events-none"
      />
    );
  }

  // Days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayInfo = dayPaymentMap[dayStr];
    const plan = plansMap[dayStr];
    const isSelected = selectedDate === dayStr;
    const isToday = todayStr === dayStr;

    const hasStarting = dayInfo && dayInfo.startingPayments.length > 0;
    const hasEnding = dayInfo && dayInfo.endingPayments.length > 0;
    const hasSpanning = dayInfo && dayInfo.spanningPayments.length > 0;
    const hasAnyPayment = Boolean(dayInfo?.hasActivity);

    let borderClass = 'border-border/60';
    let bgClass = 'bg-card hover:bg-muted/50';

    if (hasStarting || hasEnding) {
      borderClass = 'border-emerald-500/40 dark:border-emerald-500/30';
      bgClass = 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.07] hover:bg-emerald-500/[0.1]';
    } else if (hasSpanning) {
      borderClass = 'border-emerald-500/25 border-dashed dark:border-emerald-500/20';
      bgClass = 'bg-emerald-500/[0.02] dark:bg-emerald-500/[0.03] hover:bg-emerald-500/[0.08]';
    }

    if (isSelected) {
      borderClass = 'border-primary ring-2 ring-primary/30';
      bgClass = hasAnyPayment 
        ? 'bg-emerald-500/[0.12] dark:bg-emerald-500/[0.15]' 
        : 'bg-primary/10';
    } else if (isToday) {
      borderClass = hasAnyPayment 
        ? 'border-emerald-500 dark:border-emerald-400' 
        : 'border-foreground/50';
    }

    calendarCells.push(
      <button
        key={dayStr}
        type="button"
        onClick={() => onSelectDate(dayStr)}
        className={`min-h-[76px] sm:min-h-[88px] md:min-h-[96px] p-2 sm:p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all relative group cursor-pointer ${borderClass} ${bgClass}`}
      >
        {/* Cell Header: Day number & Today badge */}
        <div className="flex items-center justify-between w-full">
          <span
            className={`text-xs font-semibold rounded px-1.5 py-0.5 transition-colors ${
              isToday
                ? 'bg-foreground text-background font-bold'
                : isSelected
                ? 'bg-muted text-foreground font-bold'
                : 'text-muted-foreground group-hover:text-foreground'
            }`}
          >
            {day}
          </span>
          {isToday && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground hidden sm:inline">
              Today
            </span>
          )}
        </div>

        {/* Cell Content: Ad Budget Payments / Target */}
        <div className="w-full mt-auto pt-1 space-y-1">
          {hasAnyPayment ? (
            <div className="space-y-0.5">
              {/* Single day payments */}
              {dayInfo.startingPayments
                .filter((p) => p.isSingleDay)
                .map((p) => (
                  <div
                    key={`single-${p.id}`}
                    className="flex items-center gap-1.5 text-[10.5px] sm:text-xs font-semibold text-emerald-700 dark:text-emerald-300 truncate"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate font-mono">₹{Math.round(p.amountPaid).toLocaleString('en-IN')}</span>
                  </div>
                ))}

              {/* Multi-day Period: STARTING on this date */}
              {dayInfo.startingPayments
                .filter((p) => !p.isSingleDay)
                .map((p) => (
                  <div
                    key={`start-${p.id}`}
                    className="p-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] sm:text-[10.5px] font-bold font-mono truncate">
                        ₹{Math.round(p.amountPaid).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[7.5px] font-extrabold uppercase px-1 py-0.2 rounded bg-emerald-500/25 shrink-0">
                        Start
                      </span>
                    </div>
                    <span className="text-[8.5px] text-muted-foreground block truncate">
                      {formatShortDate(p.startDate)}–{formatShortDate(p.endDate)} ({p.daysCount}d)
                    </span>
                  </div>
                ))}

              {/* Multi-day Period: ENDING on this date */}
              {dayInfo.endingPayments.map((p) => (
                <div
                  key={`end-${p.id}`}
                  className="p-1 rounded bg-blue-500/15 border border-blue-500/30 text-blue-800 dark:text-blue-200"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] sm:text-[10.5px] font-bold font-mono truncate">
                      ₹{Math.round(p.amountPaid).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[7.5px] font-extrabold uppercase px-1 py-0.2 rounded bg-blue-500/25 shrink-0">
                      End
                    </span>
                  </div>
                  <span className="text-[8.5px] text-muted-foreground block truncate">
                    {formatShortDate(p.startDate)}–{formatShortDate(p.endDate)} ({p.daysCount}d)
                  </span>
                </div>
              ))}

              {/* Multi-day Period: ACTIVE SPAN across this date (if no start or end) */}
              {!hasStarting && !hasEnding && dayInfo.spanningPayments.length > 0 && (
                <div className="px-1 py-0.5 rounded bg-muted/60 border border-border/60 text-muted-foreground truncate">
                  <span className="text-[8.5px] font-medium block truncate">
                    ⟷ {formatShortDate(dayInfo.spanningPayments[0].startDate)}–{formatShortDate(dayInfo.spanningPayments[0].endDate)} (₹{Math.round(dayInfo.spanningPayments[0].amountPaid).toLocaleString('en-IN')})
                  </span>
                </div>
              )}
            </div>
          ) : plan && parseFloat(plan.totalBudget) > 0 ? (
            <div className="text-[10px] text-muted-foreground truncate">
              Target ₹{parseFloat(plan.totalBudget).toLocaleString('en-IN')}
            </div>
          ) : (
            <span className="text-[10px] text-muted-foreground/40 hidden sm:inline-block">
              —
            </span>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-muted rounded-lg border border-border text-foreground">
            <CalendarIcon size={16} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground tracking-tight">{monthLabel}</h3>
            <p className="text-xs text-muted-foreground">
              Shows amount paid for each budget period starting date and ending date
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleJumpToToday}
            className="px-2.5 py-1 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground transition-colors"
          >
            Today
          </button>
          <div className="flex items-center bg-card border border-border rounded-lg p-0.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next month"
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="text-[11px] font-semibold text-muted-foreground py-1 uppercase tracking-wider">
            {wd}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 flex-1">
        {calendarCells}
      </div>

      {/* Calendar Summary Footer */}
      <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium text-foreground">Payments Recorded:</span>
            <span>{paymentsInMonthCount} ({singleDayPaymentsCount} single-day, {multiDayPaymentsCount} multi-day)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
            <span className="font-medium text-foreground">Active Days:</span>
            <span>{daysWithPaymentCount} of {daysInMonth}</span>
          </div>
        </div>

        <div className="font-semibold text-foreground flex items-center gap-2">
          <span className="text-muted-foreground">Total Paid in {currentMonth.toLocaleString('default', { month: 'short' })}:</span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            ₹{Math.round(totalPaidInMonth).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Selected Date Details Panel (Only shown if showDetailsPanel is true) */}
      {showDetailsPanel && selectedDate && (
        <div className="mt-2 pt-4 border-t border-border bg-muted/20 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <CalendarIcon size={15} className="text-muted-foreground" />
              <h4 className="text-sm sm:text-base font-semibold text-foreground">
                {formattedSelectedDate}
              </h4>
              {selectedDate === todayStr && (
                <span className="px-2 py-0.5 bg-foreground text-background text-[10px] font-bold rounded uppercase tracking-wider">
                  Today
                </span>
              )}
            </div>

            {selectedDayInfo && selectedDayInfo.allPayments.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Active Periods for this Date:</span>
                <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
                  {selectedDayInfo.allPayments.length}
                </span>
              </div>
            )}
          </div>

          {selectedDayInfo && selectedDayInfo.allPayments.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedDayInfo.allPayments.map((p) => {
                  const isStart = p.startDate === selectedDate;
                  const isEnd = p.endDate === selectedDate;

                  let roleBadgeText = 'Period Active Day';
                  let roleBadgeClass = 'bg-muted text-muted-foreground border-border';

                  if (p.isSingleDay) {
                    roleBadgeText = '1-Day Payment';
                    roleBadgeClass = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
                  } else if (isStart) {
                    roleBadgeText = 'Period Starting Date';
                    roleBadgeClass = 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 font-bold';
                  } else if (isEnd) {
                    roleBadgeText = 'Period Ending Date';
                    roleBadgeClass = 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40 font-bold';
                  }

                  return (
                    <div
                      key={p.id}
                      className="bg-card border border-border rounded-xl p-4 text-xs space-y-3 shadow-none hover:border-border-hover transition-colors"
                    >
                      {/* Period Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-semibold text-foreground">
                          <CreditCard size={14} className="text-muted-foreground shrink-0" />
                          <span className="tracking-tight">
                            {formatFullDate(p.startDate)} {p.startDate !== p.endDate && `→ ${formatFullDate(p.endDate)}`}
                          </span>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${roleBadgeClass}`}>
                          {roleBadgeText}
                        </span>
                      </div>

                      {/* Period Amount Paid & Dates Grid */}
                      <div className="grid grid-cols-2 gap-3 p-2.5 rounded-lg bg-muted/40 border border-border/50">
                        <div>
                          <span className="text-[10px] text-muted-foreground block font-medium uppercase tracking-wider">
                            Amount Paid
                          </span>
                          <span className="text-base sm:text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            ₹{p.amountPaid.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-muted-foreground block font-medium uppercase tracking-wider">
                            Duration
                          </span>
                          <span className="text-sm font-semibold text-foreground">
                            {p.daysCount} {p.daysCount === 1 ? 'Day' : 'Days'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-muted-foreground block font-medium uppercase tracking-wider">
                            Starting Date
                          </span>
                          <span className="font-semibold text-foreground">
                            {formatFullDate(p.startDate)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-muted-foreground block font-medium uppercase tracking-wider">
                            Ending Date
                          </span>
                          <span className="font-semibold text-foreground">
                            {formatFullDate(p.endDate)}
                          </span>
                        </div>
                      </div>

                      {/* Payment Metadata */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-muted-foreground border-t border-border/40">
                        <div className="flex items-center gap-3">
                          {p.paymentMethodName && (
                            <span>Method: <strong className="text-foreground">{p.paymentMethodName}</strong></span>
                          )}
                          {p.referenceNumber && (
                            <span>Ref: <strong className="font-mono text-foreground">{p.referenceNumber}</strong></span>
                          )}
                        </div>

                        {p.paymentDate && (
                          <span>Paid on: <strong className="text-foreground">{formatFullDate(p.paymentDate)}</strong></span>
                        )}
                      </div>

                      {p.notes && (
                        <p className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded border border-border/40 italic">
                          &ldquo;{p.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-dashed border-border rounded-xl p-4 text-xs">
              <span className="text-muted-foreground text-center sm:text-left">
                No active budget payments recorded for this date.
              </span>
              {canEdit && onRecordPayment && (
                <Button
                  size="xs"
                  onClick={() => onRecordPayment(selectedDate, selectedDate)}
                  className="gap-1.5 text-xs shrink-0 rounded-full"
                >
                  <Plus size={12} />
                  <span>Record Payment for this Date</span>
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
