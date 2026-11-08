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
}

interface DayTxContribution {
  id: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  amountPaid: number;
  dailyAmount: number;
  paymentMethodName?: string;
  status: string;
  notes?: string | null;
}

interface DaySpendDetail {
  totalSpend: number;
  contributions: DayTxContribution[];
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
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
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

  // Build daily spend map from all recorded transactions covering starting date to ending date
  const dailySpendMap = useMemo(() => {
    const map: Record<string, DaySpendDetail> = {};

    transactions.forEach((tx) => {
      // Exclude cancelled/failed transactions
      if (tx.status && tx.status !== 'PAID') return;

      const start = normalizeDateStr(tx.weekStartDate);
      const end = normalizeDateStr(tx.weekEndDate);
      if (!start || !end) return;

      const daysCount = getDaysCount(start, end);
      const rawAmount = typeof tx.amountPaid === 'number' ? tx.amountPaid : parseFloat(String(tx.amountPaid).replace(/,/g, '') || '0');
      const totalAmount = isNaN(rawAmount) ? 0 : rawAmount;
      const dailyAmount = daysCount > 0 ? totalAmount / daysCount : 0;

      const [sy, sm, sd] = start.split('-').map(Number);
      for (let i = 0; i < daysCount; i++) {
        const d = new Date(Date.UTC(sy, sm - 1, sd + i));
        const dayStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

        if (!map[dayStr]) {
          map[dayStr] = {
            totalSpend: 0,
            contributions: [],
          };
        }

        map[dayStr].totalSpend += dailyAmount;
        map[dayStr].contributions.push({
          id: tx.id,
          startDate: start,
          endDate: end,
          daysCount,
          amountPaid: totalAmount,
          dailyAmount,
          paymentMethodName: tx.paymentMethodName,
          status: tx.status || 'PAID',
          notes: tx.notes,
        });
      }
    });

    return map;
  }, [transactions]);

  // Calculate monthly stats based on daily spends in currentMonth
  const { totalSpentInMonth, daysWithSpendCount, daysWithoutSpendCount } = useMemo(() => {
    let total = 0;
    let withSpend = 0;
    let withoutSpend = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const plan = plansMap[dayStr];
      const planBudget = plan ? parseFloat(plan.totalBudget) || 0 : 0;
      const spend = dailySpendMap[dayStr]?.totalSpend || planBudget;
      if (spend > 0) {
        total += spend;
        withSpend++;
      } else {
        withoutSpend++;
      }
    }

    return {
      totalSpentInMonth: total,
      daysWithSpendCount: withSpend,
      daysWithoutSpendCount: withoutSpend,
    };
  }, [dailySpendMap, daysInMonth, month, year, plansMap]);

  const monthLabel = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Selected date details
  const selectedDayInfo = dailySpendMap[selectedDate];
  const selectedDaySpend = selectedDayInfo?.totalSpend || 0;
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
        className="min-h-[64px] sm:min-h-[76px] md:min-h-[88px] rounded-xl bg-muted/20 border border-border/40 opacity-20 pointer-events-none"
      />
    );
  }

  // Days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const daySpendInfo = dailySpendMap[dayStr];
    const plan = plansMap[dayStr];
    const planBudget = plan ? parseFloat(plan.totalBudget) || 0 : 0;
    const daySpend = daySpendInfo?.totalSpend || planBudget;
    const isSelected = selectedDate === dayStr;
    const isToday = todayStr === dayStr;

    let borderClass = 'border-border/60';
    let bgClass = 'bg-card hover:bg-muted/50';

    if (daySpend > 0) {
      borderClass = 'border-emerald-500/35 dark:border-emerald-500/25';
      bgClass = 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] hover:bg-emerald-500/[0.1]';
    }

    if (isSelected) {
      borderClass = 'border-primary ring-2 ring-primary/30';
      bgClass = daySpend > 0 
        ? 'bg-emerald-500/[0.1] dark:bg-emerald-500/[0.12]' 
        : 'bg-primary/10';
    } else if (isToday) {
      borderClass = daySpend > 0 
        ? 'border-emerald-500 dark:border-emerald-400' 
        : 'border-foreground/40';
    }

    calendarCells.push(
      <button
        key={dayStr}
        type="button"
        onClick={() => onSelectDate(dayStr)}
        className={`min-h-[64px] sm:min-h-[76px] md:min-h-[88px] p-2 sm:p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all relative group cursor-pointer ${borderClass} ${bgClass}`}
      >
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

        <div className="w-full mt-auto pt-1">
          {daySpend > 0 ? (
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[11px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-300 truncate">
                  ₹{Math.round(daySpend).toLocaleString('en-IN')}
                </span>
              </div>
              {daySpendInfo && daySpendInfo.contributions.length > 1 && (
                <span className="text-[9px] text-muted-foreground hidden sm:block truncate">
                  {daySpendInfo.contributions.length} periods
                </span>
              )}
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
              Daily ad spend calculated from budget payment periods
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
            <span className="font-medium text-foreground">Active Spend Days:</span>
            <span>{daysWithSpendCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
            <span className="font-medium text-foreground">No Spend Days:</span>
            <span>{daysWithoutSpendCount}</span>
          </div>
        </div>

        <div className="font-semibold text-foreground flex items-center gap-2">
          <span className="text-muted-foreground">Total Spent in {currentMonth.toLocaleString('default', { month: 'short' })}:</span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            ₹{Math.round(totalSpentInMonth).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Selected Date Details Panel */}
      {selectedDate && (
        <div className="mt-2 pt-4 border-t border-border bg-muted/20 rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarIcon size={14} className="text-muted-foreground" />
              <h4 className="text-sm font-semibold text-foreground">
                {formattedSelectedDate}
              </h4>
              {selectedDate === todayStr && (
                <span className="px-1.5 py-0.5 bg-muted border border-border text-[10px] font-semibold rounded uppercase tracking-wider text-foreground">
                  Today
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Day Total Spend:</span>
              <span className="text-sm font-bold text-foreground font-mono">
                ₹{Math.round(selectedDaySpend).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {selectedDayInfo && selectedDayInfo.contributions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Active Budget Payment Periods ({selectedDayInfo.contributions.length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {selectedDayInfo.contributions.map((c) => (
                  <div
                    key={c.id}
                    className="bg-card border border-border rounded-lg p-3 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-semibold text-foreground">
                        <CreditCard size={13} className="text-muted-foreground" />
                        <span>{c.startDate} to {c.endDate}</span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        {c.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-muted-foreground pt-1 border-t border-border/50">
                      <div>
                        <span className="text-[10px] block">Period Total ({c.daysCount}d)</span>
                        <span className="font-semibold text-foreground">
                          ₹{c.amountPaid.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] block">Daily Spend</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          ₹{Math.round(c.dailyAmount).toLocaleString('en-IN')}/day
                        </span>
                      </div>
                    </div>

                    {c.paymentMethodName && (
                      <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border/40">
                        <span>Method: {c.paymentMethodName}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-dashed border-border rounded-lg p-3.5 text-xs">
              <span className="text-muted-foreground text-center sm:text-left">
                No active budget payments recorded for this date.
              </span>
              {canEdit && onRecordPayment && (
                <Button
                  size="xs"
                  onClick={() => onRecordPayment(selectedDate, selectedDate)}
                  className="gap-1.5 text-xs shrink-0"
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
