import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

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

interface MetaAdsCalendarProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  plansMap: Record<string, DailyPlanItem>;
  todayStr: string;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MetaAdsCalendar({
  currentMonth,
  onMonthChange,
  selectedDate,
  onSelectDate,
  plansMap,
  todayStr,
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

  // Month stats
  let totalPlannedInMonth = 0;
  let doneCount = 0;
  let inProgressCount = 0;
  let notDoneCount = 0;

  Object.values(plansMap).forEach((p) => {
    if (p.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
      totalPlannedInMonth += parseFloat(p.totalBudget) || 0;
      if (p.status === 'DONE') doneCount++;
      else if (p.status === 'IN_PROGRESS') inProgressCount++;
      else if (p.status === 'NOT_DONE') notDoneCount++;
    }
  });

  const monthLabel = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Generate calendar cells
  const calendarCells = [];

  // Padding for previous month
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(
      <div
        key={`empty-${i}`}
        className="h-14 sm:h-16 md:h-20 rounded-lg bg-muted/20 border border-border/40 opacity-20 pointer-events-none"
      />
    );
  }

  // Days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const plan = plansMap[dayStr];
    const isSelected = selectedDate === dayStr;
    const isToday = todayStr === dayStr;

    let statusBadge = null;
    let borderClass = 'border-border/60';
    let bgClass = 'bg-card hover:bg-muted/50';

    if (plan) {
      if (plan.status === 'DONE') {
        statusBadge = (
          <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="hidden sm:inline">₹{parseFloat(plan.totalBudget).toLocaleString('en-IN')}</span>
          </span>
        );
      } else if (plan.status === 'IN_PROGRESS') {
        statusBadge = (
          <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            <span className="hidden sm:inline">₹{parseFloat(plan.totalBudget).toLocaleString('en-IN')}</span>
          </span>
        );
      } else {
        statusBadge = (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600 shrink-0" />
            <span className="hidden sm:inline">Not Done</span>
          </span>
        );
      }
    }

    if (isSelected) {
      borderClass = 'border-foreground/80 bg-muted/80 ring-1 ring-foreground/20';
      bgClass = 'bg-muted/80';
    } else if (isToday) {
      borderClass = 'border-foreground/40';
    }

    calendarCells.push(
      <button
        key={dayStr}
        type="button"
        onClick={() => onSelectDate(dayStr)}
        className={`h-14 sm:h-16 md:h-20 p-1.5 sm:p-2 rounded-lg border text-left flex flex-col justify-between transition-colors relative group cursor-pointer ${borderClass} ${bgClass}`}
      >
        <div className="flex items-center justify-between w-full">
          <span
            className={`text-xs font-semibold rounded px-1 py-0.5 ${
              isToday
                ? 'bg-muted text-foreground font-bold'
                : isSelected
                ? 'text-foreground'
                : 'text-muted-foreground group-hover:text-foreground'
            }`}
          >
            {day}
          </span>
          {isToday && (
            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:inline">
              Today
            </span>
          )}
        </div>

        <div className="w-full mt-auto">
          {statusBadge || (
            <span className="text-[10px] text-muted-foreground/60 group-hover:text-muted-foreground hidden sm:block">
              + Plan
            </span>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-muted rounded-lg border border-border text-foreground">
            <CalendarIcon size={16} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground tracking-tight">{monthLabel}</h3>
            <p className="text-xs text-muted-foreground">Click a day to view or edit campaign planner</p>
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
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center">
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

      {/* Calendar Status Summary Footer */}
      <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Done ({doneCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>In Progress ({inProgressCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600" />
            <span>Not Done ({notDoneCount})</span>
          </div>
        </div>

        <div className="font-semibold text-foreground">
          Planned: <span className="text-foreground">₹{totalPlannedInMonth.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
}
