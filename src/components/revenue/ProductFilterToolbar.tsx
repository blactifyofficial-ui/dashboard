'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition, useState, useId } from 'react';
import { Calendar, CalendarDays, X, Clock, Check, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ProductFilterToolbarProps {
  currentPeriod: string;
  currentMonth: string;
  currentFrom: string;
  currentTo: string;
  availableMonths: string[];
  totalProducts: number;
  totalRevenue: number;
  totalUnits: number;
  activeLabel: string;
}

export default function ProductFilterToolbar({
  currentPeriod,
  currentMonth,
  currentFrom,
  currentTo,
  availableMonths,
  totalProducts,
  totalRevenue,
  totalUnits,
  activeLabel,
}: ProductFilterToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [showCustomRange, setShowCustomRange] = useState(Boolean(currentFrom || currentTo));
  const [customFrom, setCustomFrom] = useState(currentFrom || '');
  const [customTo, setCustomTo] = useState(currentTo || '');

  const fromInputId = useId();
  const toInputId = useId();

  const filterPresets = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Daily (Today)' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: '7d', label: 'Last 7 Days' },
    { id: 'this_month', label: 'Monthly' },
    { id: 'last_month', label: 'Last Month' },
    { id: '30d', label: 'Last 30 Days' },
    { id: '90d', label: 'Last 90 Days', icon: Sparkles },
  ];

  const hasActiveFilter = (currentPeriod && currentPeriod !== 'all') || Boolean(currentMonth) || Boolean(currentFrom) || Boolean(currentTo);

  const updateUrlParams = (updater: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'products');
    params.delete('page'); // Reset to page 1 on filter change
    updater(params);

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  const handleSelectPreset = (presetId: string) => {
    setShowCustomRange(false);
    updateUrlParams((params) => {
      if (presetId === 'all') {
        params.delete('period');
      } else {
        params.set('period', presetId);
      }
      params.delete('month');
      params.delete('from');
      params.delete('to');
    });
  };

  const handleMonthChange = (monthVal: string) => {
    setShowCustomRange(false);
    updateUrlParams((params) => {
      if (monthVal) {
        params.set('month', monthVal);
        params.delete('period');
        params.delete('from');
        params.delete('to');
      } else {
        params.delete('month');
      }
    });
  };

  const handleApplyCustomRange = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customFrom) return;

    updateUrlParams((params) => {
      params.set('from', customFrom);
      if (customTo) {
        params.set('to', customTo);
      } else {
        params.delete('to');
      }
      params.delete('period');
      params.delete('month');
    });
  };

  const handleClearFilters = () => {
    setShowCustomRange(false);
    setCustomFrom('');
    setCustomTo('');
    updateUrlParams((params) => {
      params.delete('period');
      params.delete('month');
      params.delete('from');
      params.delete('to');
    });
  };

  return (
    <div className={`p-4 sm:px-6 py-3 border-b border-border bg-card/60 space-y-3 transition-opacity ${isPending ? 'opacity-70' : 'opacity-100'}`}>
      {/* Top Filter Controls: Presets, Month dropdown, Custom range toggle */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Presets and Month Selector */}
          <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-w-full py-0.5">
            {filterPresets.map((opt) => {
              const isSelected = !currentMonth && !currentFrom && (
                currentPeriod === opt.id ||
                (opt.id === 'all' && (!currentPeriod || currentPeriod === 'all')) ||
                (opt.id === 'today' && currentPeriod === 'daily') ||
                (opt.id === 'this_month' && currentPeriod === 'monthly')
              );
              const Icon = opt.icon;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectPreset(opt.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-normal rounded-full transition-all active:scale-95 tracking-[-0.1px] shrink-0 whitespace-nowrap ${isSelected
                    ? 'bg-[#0066cc] text-white'
                    : 'bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60'
                    }`}
                >
                  {Icon && <Icon size={12} className={isSelected ? 'text-white' : 'text-[#0066cc] dark:text-[#2997ff]'} />}
                  <span>{opt.label}</span>
                </button>
              );
            })}

            {/* Month Selector Dropdown */}
            {availableMonths.length > 0 && (
                <div className="relative inline-flex items-center shrink-0">
                  <Calendar size={13} className="absolute left-3 text-muted-foreground pointer-events-none" />
                  <select
                    aria-label="Filter by month"
                    value={currentMonth}
                    onChange={(e) => handleMonthChange(e.target.value)}
                className={`pl-8 pr-4 py-1.5 text-[13px] font-normal rounded-full border appearance-none transition-all cursor-pointer active:scale-95 tracking-[-0.1px] shrink-0 whitespace-nowrap ${currentMonth
                      ? 'bg-[#0066cc] text-white border-transparent'
                      : 'bg-muted/70 text-muted-foreground border-border/60 hover:text-foreground'
                      }`
                    }
                  >
                    <option value="" className="bg-popover text-popover-foreground">Select Month...</option>
                    {
                      availableMonths.map((m) => {
                        const [year, monthNum] = m.split('-');
                        const date = new Date(parseInt(year, 10), parseInt(monthNum, 10) - 1, 1);
                        const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                        return (
                          <option key={m} value={m} className="bg-popover text-popover-foreground">
                            {label}
                          </option>
                        );
                      })
                    }
                  </select>
                </div>
          )}

                {/* Custom Date Range Toggle */}
                <button
                  type="button"
                  onClick={() => setShowCustomRange(!showCustomRange)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-normal rounded-full border transition-all cursor-pointer active:scale-95 tracking-[-0.1px] shrink-0 whitespace-nowrap ${showCustomRange || currentFrom
                    ? 'bg-card text-foreground border-border'
                    : 'bg-muted/70 text-muted-foreground border-border/60 hover:text-foreground'
                    }`}
                >
                  <CalendarDays size={13} />
                  <span>Custom Dates</span>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${showCustomRange ? 'rotate-180' : ''}`} />
                </button>

                {/* Clear Filters Button if any active filter */}
                {hasActiveFilter && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="px-3 py-1.5 text-[13px] font-normal rounded-full text-[#ff453a] hover:bg-[#ff453a]/10 transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                    title="Reset all date filters to all-time"
                  >
                    <X size={13} />
                    <span>Reset</span>
                  </button>
                )}
              </div>
    </div>

          {/* Expandable Custom Date Range Selector */}
          {
            showCustomRange && (
              <form onSubmit={handleApplyCustomRange} className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <label htmlFor={fromInputId} className="font-medium">From:</label>
                  <input
                    id={fromInputId}
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="bg-card border border-input rounded-md px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-primary shadow-xs"
                    required
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <label htmlFor={toInputId} className="font-medium">To:</label>
                  <input
                    id={toInputId}
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="bg-card border border-input rounded-md px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-primary shadow-xs"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <Button type="submit" size="xs" variant="default" className="h-7 text-xs">
                    <Check size={12} className="mr-1" />
                    Apply
                  </Button>
                  {(currentFrom || currentTo) && (
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={handleClearFilters}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </form>
            )
          }

          {/* Active Filter & Period Summary Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted border border-border text-foreground font-medium text-[11px]">
                <Clock size={12} className="text-muted-foreground shrink-0" />
                <span>Filter:</span>
                <strong className="text-foreground font-semibold">{activeLabel}</strong>
              </span>
              {hasActiveFilter && (
                <span className="text-[11px] text-muted-foreground">
                  Showing filtered results
                </span>
              )}
            </div>

            {/* Live Period Metrics Pill */}
            <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground bg-muted/50 px-3 py-1 rounded-md border border-border/50">
              <div>
                <span>Units: </span>
                <strong className="text-foreground font-semibold">{totalUnits.toLocaleString('en-IN')}</strong>
              </div>
              <span className="text-border">•</span>
              <div>
                <span>Revenue: </span>
                <strong className="text-foreground font-semibold">
                  ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </div>
              <span className="text-border">•</span>
              <div>
                <span>Products: </span>
                <strong className="text-foreground font-semibold">{totalProducts.toLocaleString('en-IN')}</strong>
              </div>
            </div>
          </div>
        </div>
        );
}
