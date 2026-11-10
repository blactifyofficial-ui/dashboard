"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Plus, Check, Flame, Calendar as CalendarIcon } from "lucide-react";
import { DailySavingEntry } from "./types";

interface SavingsCalendarViewProps {
  targetMonth: string; // 'YYYY-MM'
  onMonthChange: (month: string) => void;
  entries: DailySavingEntry[];
  todayStr: string;
  dailyTarget: number;
  onSelectDate: (date: string, entry: DailySavingEntry | null) => void;
}

export function SavingsCalendarView({
  targetMonth,
  onMonthChange,
  entries,
  todayStr,
  dailyTarget,
  onSelectDate,
}: SavingsCalendarViewProps) {
  // Parse year & month
  const [yearStr, monthNumStr] = targetMonth.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10); // 1-indexed (1-12)

  // Map entries by date for O(1) lookup
  const entriesMap = React.useMemo(() => {
    const map = new Map<string, DailySavingEntry>();
    for (const entry of entries) {
      map.set(entry.date, entry);
    }
    return map;
  }, [entries]);

  // First day of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  // Total days in current month
  const daysInMonth = new Date(year, month, 0).getDate();

  // Month navigation helpers
  const handlePrevMonth = () => {
    const prevDate = new Date(year, month - 2, 1);
    const prevY = prevDate.getFullYear();
    const prevM = String(prevDate.getMonth() + 1).padStart(2, "0");
    onMonthChange(`${prevY}-${prevM}`);
  };

  const handleNextMonth = () => {
    const nextDate = new Date(year, month, 1);
    const nextY = nextDate.getFullYear();
    const nextM = String(nextDate.getMonth() + 1).padStart(2, "0");
    onMonthChange(`${nextY}-${nextM}`);
  };

  const monthName = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1)
  );

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="rounded-3xl border border-border bg-card p-5 md:p-6 shadow-xs">
      {/* Calendar Header with Month Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground capitalize">{monthName}</h2>
            <p className="text-xs text-muted-foreground">
              Click any day to log or view saved amounts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick jump to current month */}
          {targetMonth !== todayStr.substring(0, 7) && (
            <button
              onClick={() => onMonthChange(todayStr.substring(0, 7))}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-border bg-muted/40 hover:bg-muted text-foreground transition"
            >
              Current Month
            </button>
          )}

          <div className="flex items-center rounded-xl border border-border bg-background p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-muted-foreground">
        {daysOfWeek.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Leading empty cells for days before the 1st */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[85px] sm:min-h-[95px] rounded-2xl bg-muted/10 opacity-30" />
        ))}

        {/* Days of the month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNumber = i + 1;
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
          const isToday = dateStr === todayStr;
          const isFuture = dateStr > todayStr;
          const entry = entriesMap.get(dateStr) || null;
          const hasSaved = Boolean(entry && Number(entry.amount) > 0);
          const savedAmt = entry ? Number(entry.amount) : 0;
          const isTargetMet = dailyTarget > 0 && savedAmt >= dailyTarget;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(dateStr, entry)}
              disabled={isFuture}
              className={`min-h-[85px] sm:min-h-[95px] p-2.5 rounded-2xl border text-left flex flex-col justify-between transition group relative overflow-hidden ${
                hasSaved
                  ? isTargetMet
                    ? "bg-emerald-500/10 border-emerald-500/40 hover:border-emerald-500/70"
                    : "bg-emerald-500/5 border-emerald-500/25 hover:border-emerald-500/50"
                  : isToday
                  ? "bg-amber-500/5 border-amber-500/40 ring-2 ring-amber-500/20 hover:border-amber-500"
                  : isFuture
                  ? "bg-muted/10 border-border/40 opacity-40 cursor-not-allowed"
                  : "bg-card border-border hover:border-muted-foreground/30 hover:bg-muted/30"
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-xs font-bold rounded-lg px-1.5 py-0.5 ${
                    isToday
                      ? "bg-amber-500 text-amber-950 font-black shadow-xs"
                      : hasSaved
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {dayNumber}
                </span>

                {hasSaved ? (
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                ) : isToday ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                    <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                    Today
                  </span>
                ) : null}
              </div>

              {/* Day Content: Amount Saved or Empty State */}
              <div className="mt-1">
                {hasSaved ? (
                  <div>
                    <div className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
                      +₹{savedAmt >= 1000 ? `${(savedAmt / 1000).toFixed(savedAmt % 1000 === 0 ? 0 : 1)}k` : savedAmt}
                    </div>
                    {entry?.destination && (
                      <div className="text-[10px] text-muted-foreground truncate opacity-80 mt-0.5">
                        {entry.destination === "BANK_ACCOUNT"
                          ? "🏦 Bank"
                          : entry.destination === "CASH"
                          ? "💵 Cash"
                          : entry.destination === "EMERGENCY_FUND"
                          ? "🛡️ Reserve"
                          : "📈 Invest"}
                      </div>
                    )}
                  </div>
                ) : isToday ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    <Plus className="w-3 h-3" /> Mark now
                  </span>
                ) : !isFuture ? (
                  <span className="text-[10px] text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition">
                    + Log
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

