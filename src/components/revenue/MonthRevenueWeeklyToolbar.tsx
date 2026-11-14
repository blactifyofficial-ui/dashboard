'use client';

import { Calendar, X, Sparkles } from 'lucide-react';
import { MonthWeekPreset } from '@/lib/date-utils';

export interface MonthRevenueWeeklyToolbarProps {
  presets: MonthWeekPreset[];
  selectedWeekId: string;
  onSelectWeek: (preset: MonthWeekPreset) => void;
  statsByPresetId: Record<string, { orderCount: number; revenue: number }>;
}

export default function MonthRevenueWeeklyToolbar({
  presets,
  selectedWeekId,
  onSelectWeek,
  statsByPresetId,
}: MonthRevenueWeeklyToolbarProps) {
  const activePreset = presets.find((p) => p.id === selectedWeekId) || presets[0];
  const isFiltered = activePreset && activePreset.id !== 'all';
  const activeStats = statsByPresetId[activePreset.id] || { orderCount: 0, revenue: 0 };

  const handleReset = () => {
    const allPreset = presets.find((p) => p.id === 'all') || presets[0];
    onSelectWeek(allPreset);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-3 sm:p-3.5 shadow-xs space-y-2.5">
      {/* Top row: Section title & Active selection context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Calendar size={13} />
          </div>
          <span className="text-xs font-semibold text-foreground tracking-[-0.1px]">
            Weekly Filter
          </span>

          {isFiltered ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>
                {activePreset.label} ({activePreset.rangeLabel})
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="font-mono">{activeStats.orderCount} orders</span>
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              Viewing full month totals across all weeks
            </span>
          )}
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground font-medium px-2 py-1 rounded-md bg-muted hover:bg-muted/80 transition-colors self-start sm:self-auto active:scale-95"
          >
            <X size={12} />
            <span>Reset to All Month</span>
          </button>
        )}
      </div>

      {/* Preset Pills row */}
      <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-0.5">
        {presets.map((preset) => {
          const isSelected = preset.id === selectedWeekId;
          const stats = statsByPresetId[preset.id] || { orderCount: 0, revenue: 0 };

          // Styling logic
          let buttonClasses = 'text-muted-foreground hover:text-foreground hover:bg-muted/60 border-transparent';

          if (isSelected) {
            if (preset.isCurrentWeek) {
              buttonClasses =
                'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 shadow-xs font-semibold';
            } else if (preset.isLastWeek) {
              buttonClasses =
                'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 shadow-xs font-semibold';
            } else {
              buttonClasses = 'bg-muted text-foreground border-border shadow-xs font-semibold';
            }
          }

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectWeek(preset)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all active:scale-95 shrink-0 whitespace-nowrap border ${buttonClasses}`}
              title={`${preset.label} (${preset.rangeLabel}): ${stats.orderCount} orders, ₹${stats.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            >
              {preset.isCurrentWeek && (
                <span className="relative flex h-2 w-2 mr-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              )}

              {preset.isLastWeek && (
                <Sparkles size={11} className="text-sky-500 dark:text-sky-400 shrink-0" />
              )}

              <span>{preset.label}</span>
              <span className="text-[10px] text-muted-foreground opacity-80 font-normal">
                ({preset.rangeLabel})
              </span>

              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected
                    ? 'bg-foreground/15 text-foreground font-bold'
                    : 'bg-muted border border-border/80 text-muted-foreground'
                }`}
              >
                {stats.orderCount}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
