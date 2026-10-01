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
    <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Active Month Navigator */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handlePrev}
          disabled={activeIndex <= 0}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          title="Previous Month"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-lg">
          <Calendar size={14} className="text-white/60" />
          <span className="text-sm font-semibold text-white">
            {months.find((m) => m.month === activeMonth)?.label || activeMonth}
          </span>
        </div>

        <button
          onClick={handleNext}
          disabled={activeIndex >= months.length - 1}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          title="Next Month"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Quick Month Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
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
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-white text-black shadow-sm font-semibold'
                  : isLocked
                  ? 'bg-transparent text-white/30 hover:text-white/50 border border-dashed border-white/10'
                  : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              <span>{m.label}</span>
              {m.isCompleted && !isSelected && (
                <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-white/60" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
