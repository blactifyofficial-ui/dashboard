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
          className={`px-3.5 py-1.5 text-xs font-normal rounded-full transition-all whitespace-nowrap active:scale-95 ${timeRange === opt.id && !selectedMonth
              ? 'bg-[#0066cc] text-white'
              : 'bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60'
            }`}
            >
          {opt.label}
        </button>
          ))}

        {/* Month selector dropdown if available */}
        {availableMonths.length > 0 && (
          <div className="relative inline-flex items-center">
            <Calendar size={13} className="absolute left-3 text-muted-foreground pointer-events-none" />
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
              className={`pl-8 pr-4 py-1.5 text-[13px] font-normal rounded-full border appearance-none transition-all cursor-pointer active:scale-95 tracking-[-0.1px] ${selectedMonth
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
      </div>

      {/* Courier Filter */}
      <div className="flex items-center gap-2">
        {availableCouriers.length > 0 && (
          <div className="relative">
            <select
              aria-label="Filter by courier"
              value={courier}
              onChange={(e) => onCourierChange(e.target.value)}
              className="pl-4 pr-8 py-1.5 text-[13px] bg-muted/70 border border-border/60 rounded-full text-foreground font-normal appearance-none hover:border-border transition-all cursor-pointer active:scale-95 tracking-[-0.1px]"
            >
              <option value="ALL">All Couriers</option>
              {availableCouriers.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <Truck size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        )}
      </div>
    </div >

    {/* View Tabs & Search Input */ }
  < div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-border/60" >
    {/* Navigation Tabs */}
    <div className="flex items-center gap-2 p-1 rounded-full bg-muted border border-border w-fit">
      <button
        type="button"
        onClick={() => onTabChange('remittances')}
      className={`flex items-center gap-2 px-4 py-1.5 text-[13px] sm:text-[14px] font-normal rounded-full transition-all cursor-pointer active:scale-95 tracking-[-0.1px] ${activeTab === 'remittances'
          ? 'bg-card text-foreground border border-border font-semibold'
          : 'text-muted-foreground hover:text-foreground'
        }`}
          >
      <HandCoins size={15} className={activeTab === 'remittances' ? 'text-[#0066cc] dark:text-[#2997ff]' : 'text-muted-foreground'} />
      <span>Remittance Ledger</span>
      <span className="px-2 py-0.2 rounded-full text-[11px] font-mono bg-muted text-foreground border border-border">
        {remittanceCount}
      </span>
    </button>

    <button
      type="button"
      onClick={() => onTabChange('orders')}
      className={`flex items-center gap-2 px-4 py-1.5 text-[13px] sm:text-[14px] font-normal rounded-full transition-all cursor-pointer active:scale-95 tracking-[-0.1px] ${activeTab === 'orders'
        ? 'bg-card text-foreground border border-border font-semibold'
        : 'text-muted-foreground hover:text-foreground'
        }`}
    >
      <Package size={15} className={activeTab === 'orders' ? 'text-[#0066cc] dark:text-[#2997ff]' : 'text-muted-foreground'} />
      <span>COD Orders from Store</span>
      <span className="px-2 py-0.2 rounded-full text-[11px] font-mono bg-muted text-foreground border border-border">
        {ordersCount}
      </span>
    </button>
  </div>

  {/* Search Input */ }
  <div className="relative w-full sm:w-72">
    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    <input
      type="text"
      placeholder={
        activeTab === 'remittances'
          ? 'Search ref, notes, courier...'
          : 'Search order #, customer, tracking...'
      }
      value={search}
      onChange={(e) => onSearchChange(e.target.value)}
      className="w-full h-[40px] pl-10 pr-9 py-2 text-[14px] bg-card border border-border rounded-full text-foreground placeholder:text-muted-foreground/60 focus:outline-2 focus:outline-[#0071e3] focus:outline-offset-2 transition-all tracking-[-0.224px]"
    />
    {search && (
      <button
        onClick={() => onSearchChange('')}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer active:scale-95"
      >
        <X size={13} />
      </button>
    )}
  </div>
      </div >
    </div >
  );
}
