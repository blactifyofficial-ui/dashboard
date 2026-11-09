'use client';

import { Search, X, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface DebtsFilterToolbarProps {
  typeFilter: 'ALL' | 'LENT' | 'BORROWED';
  onTypeFilterChange: (type: 'ALL' | 'LENT' | 'BORROWED') => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  counts: {
    all: number;
    lent: number;
    borrowed: number;
    settled: number;
  };
}

const CATEGORIES = [
  'ALL',
  'GENERAL',
  'BUSINESS',
  'PERSONAL',
  'VENDOR',
  'PARTNER',
  'EMERGENCY',
  'OPERATIONAL',
];

export default function DebtsFilterToolbar({
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  searchQuery,
  onSearchQueryChange,
  counts,
}: DebtsFilterToolbarProps) {
  return (
    <div className="space-y-3.5">
      {/* Top row: Type Segment Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => onTypeFilterChange('ALL')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all border ${
            typeFilter === 'ALL'
              ? 'bg-muted text-foreground border-border shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent'
          }`}
        >
          <span>All Records</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              typeFilter === 'ALL'
                ? 'bg-foreground/10 text-foreground font-bold'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {counts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTypeFilterChange('LENT')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all border ${
            typeFilter === 'LENT'
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 shadow-sm'
              : 'text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-emerald-500/10 border-transparent'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            You Lent (Receivables)
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              typeFilter === 'LENT'
                ? 'bg-emerald-500/25 text-emerald-800 dark:text-emerald-200 font-bold'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {counts.lent}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTypeFilterChange('BORROWED')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all border ${
            typeFilter === 'BORROWED'
              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 shadow-sm'
              : 'text-muted-foreground hover:text-amber-600 dark:hover:text-amber-300 hover:bg-amber-500/10 border-transparent'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            You Borrowed (Payables)
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              typeFilter === 'BORROWED'
                ? 'bg-amber-500/25 text-amber-800 dark:text-amber-200 font-bold'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {counts.borrowed}
          </span>
        </button>
      </div>

      {/* Bottom row: Search input, status dropdown, category dropdown */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search by contact name, phone, ref, or note..."
            className="pl-9 pr-8 h-10 text-xs rounded-full bg-card border-border text-foreground"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-card border border-border rounded-full pl-4 pr-9 py-2 min-h-[40px] text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors cursor-pointer"
            >
              <option value="ALL" className="bg-card text-foreground">All Statuses</option>
              <option value="ACTIVE" className="bg-card text-foreground">Active (Unsettled)</option>
              <option value="PARTIALLY_SETTLED" className="bg-card text-foreground">Partially Settled</option>
              <option value="OVERDUE" className="bg-card text-foreground">Overdue Only</option>
              <option value="SETTLED" className="bg-card text-foreground">Fully Settled</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative flex-1 sm:flex-initial">
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-card border border-border rounded-full pl-4 pr-9 py-2 min-h-[40px] text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-card text-foreground">
                  {cat === 'ALL' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

