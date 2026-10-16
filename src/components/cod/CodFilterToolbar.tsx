'use client';

import { Search, X, Calendar, Truck, HandCoins, Package } from 'lucide-react';

interface CodFilterToolbarProps {
  activeTab: 'remittances' | 'orders';
  onTabChange: (tab: 'remittances' | 'orders') => void;
  timeRange: string;
  onTimeRangeChange: (timeRange: string) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  availableMonths: string[];
  search: string;
  onSearchChange: (search: string) => void;
  courier: string;
  onCourierChange: (courier: string) => void;
  availableCouriers: string[];
  remittanceCount: number;
  ordersCount: number;
}

export default function CodFilterToolbar({
  activeTab,
  onTabChange,
  timeRange,
  onTimeRangeChange,
  selectedMonth,
  onMonthChange,
  availableMonths,
  search,
  onSearchChange,
  courier,
  onCourierChange,
  availableCouriers,
  remittanceCount,
  ordersCount,
}: CodFilterToolbarProps) {
  const timeRangeOptions = [
    { id: 'all', label: 'All Time' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_30_days', label: 'Last 30 Days' },
    { id: 'last_month', label: 'Last Month' },
  ];

  return (
    <div className="space-y-4">
      {/* Top Filter Row: Time range pills, Month dropdown & Courier Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Time range pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {timeRangeOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                onTimeRangeChange(opt.id);
                onMonthChange('');
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                timeRange === opt.id && !selectedMonth
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
              }`}
            >
              {opt.label}
            </button>
          ))}

          {/* Month selector dropdown if available */}
          {availableMonths.length > 0 && (
            <div className="relative inline-flex items-center">
              <Calendar size={13} className="absolute left-2.5 text-muted-foreground pointer-events-none" />
              <select
                aria-label="Filter by month"
                value={selectedMonth}
                onChange={(e) => {
                  onMonthChange(e.target.value);
                  if (e.target.value) {
                    onTimeRangeChange(e.target.value);
                  } else {
                    onTimeRangeChange('all');
                  }
                }}
                className={`pl-7 pr-3 py-1.5 text-xs font-medium rounded-lg border appearance-none transition-colors cursor-pointer ${
                  selectedMonth
                    ? 'bg-primary text-primary-foreground border-primary font-semibold'
                    : 'bg-muted text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                <option value="" className="bg-popover text-popover-foreground">Select Month...</option>
                {availableMonths.map((m) => {
                  const [year, monthNum] = m.split('-');
                  const date = new Date(parseInt(year, 10), parseInt(monthNum, 10) - 1, 1);
                  const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                  return (
                    <option key={m} value={m} className="bg-popover text-popover-foreground">
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {/* Courier Filter */}
        <div className="flex items-center gap-2">
          {availableCouriers.length > 0 && (
            <div className="relative">
              <select
                aria-label="Filter by courier"
                value={courier}
                onChange={(e) => onCourierChange(e.target.value)}
                className="pl-3 pr-8 py-1.5 text-xs bg-muted border border-border rounded-lg text-foreground font-medium appearance-none hover:border-neutral-700 transition-colors cursor-pointer"
              >
                <option value="ALL">All Couriers</option>
                {availableCouriers.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <Truck size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {/* View Tabs & Search Input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-border/60">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onTabChange('remittances')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'remittances'
                ? 'bg-neutral-800 text-white border border-neutral-700 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <HandCoins size={15} className={activeTab === 'remittances' ? 'text-amber-400' : 'text-muted-foreground'} />
            <span>Remittance Ledger</span>
            <span className="px-1.5 py-0.2 rounded-md text-[11px] font-mono bg-muted text-foreground border border-border">
              {remittanceCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('orders')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-neutral-800 text-white border border-neutral-700 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Package size={15} className={activeTab === 'orders' ? 'text-primary' : 'text-muted-foreground'} />
            <span>COD Orders from Store</span>
            <span className="px-1.5 py-0.2 rounded-md text-[11px] font-mono bg-muted text-foreground border border-border">
              {ordersCount}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder={
              activeTab === 'remittances'
                ? 'Search ref, notes, courier...'
                : 'Search order #, customer, tracking...'
            }
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-muted/60 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-neutral-500 focus:bg-muted transition-colors"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
