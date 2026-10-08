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
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Active Month Navigator */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handlePrev}
          disabled={activeIndex <= 0}
          className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed border border-neutral-700 transition-colors"
          title="Previous Month"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-2 px-3 h-9 sm:h-8 bg-neutral-900 border border-neutral-800 rounded-lg">
          <Calendar size={13} className="text-neutral-400" />
          <span className="text-xs sm:text-sm font-semibold text-white">
            {months.find((m) => m.month === activeMonth)?.label || activeMonth}
          </span>
        </div>

        <button
          onClick={handleNext}
          disabled={activeIndex >= months.length - 1}
          className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed border border-neutral-700 transition-colors"
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
                  ? 'bg-white text-black font-semibold'
                  : isLocked
                  ? 'bg-transparent text-neutral-500 hover:text-neutral-400 border border-dashed border-neutral-800'
                  : 'bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-800'
              }`}
            >
              <span>{m.label}</span>
              {m.isCompleted && !isSelected && (
                <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
