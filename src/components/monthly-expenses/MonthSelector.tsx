'use client';

import { MonthMeta } from './types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar
} from 'lucide-react';

interface MonthSelectorProps {
  months: MonthMeta[];
  activeMonth: string;
  onSelectMonth: (monthKey: string) => void;
  onUnlockMonthPrompt: (month: MonthMeta) => void;
}

export default function MonthSelector({
  months,
  activeMonth,
  onSelectMonth,
  onUnlockMonthPrompt,
}: MonthSelectorProps) {
  const activeIndex = months.findIndex((m) => m.month === activeMonth);

  const handlePrev = () => {
    if (activeIndex > 0) {
      const prev = months[activeIndex - 1];
      if (prev.isUnlocked) {
        onSelectMonth(prev.month);
      }
    }
  };

  const handleNext = () => {
    if (activeIndex < months.length - 1) {
      const next = months[activeIndex + 1];
      if (next.isUnlocked) {
        onSelectMonth(next.month);
      } else {
        onUnlockMonthPrompt(next);
      }
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
      {/* Active Month Navigator */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handlePrev}
          disabled={activeIndex <= 0}
          className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed border border-border transition-colors"
          title="Previous Month"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-2 px-3 h-9 sm:h-8 bg-background border border-border rounded-lg">
          <Calendar size={13} className="text-muted-foreground" />
          <span className="text-xs sm:text-sm font-semibold text-foreground">
            {months.find((m) => m.month === activeMonth)?.label || activeMonth}
          </span>
        </div>

        <button
          onClick={handleNext}
          disabled={activeIndex >= months.length - 1}
          className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed border border-border transition-colors"
          title="Next Month"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Quick Month Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 touch-pan-x no-scrollbar">
        {months.map((m) => {
          const isSelected = m.month === activeMonth;
          const isLocked = !m.isUnlocked;

          return (
            <button
              key={m.month}
              onClick={() => {
                if (isLocked) {
                  onUnlockMonthPrompt(m);
                } else {
                  onSelectMonth(m.month);
                }
              }}
              className={`flex-shrink-0 px-3 py-1.5 min-h-[34px] flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                isSelected
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : isLocked
                  ? 'bg-transparent text-muted-foreground hover:text-foreground border border-dashed border-border'
                  : 'bg-background text-foreground hover:bg-muted border border-border'
              }`}
            >
              <span>{m.label}</span>
              {m.isCompleted && !isSelected && (
                <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
