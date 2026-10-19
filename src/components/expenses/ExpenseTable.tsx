'use client';

import { useState, useMemo, useSyncExternalStore } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  Calendar, 
  Clock, 
  ArrowRight, 
  TrendingUp, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  X,
  CreditCard,
  Tag
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Expense } from './types';

const emptySubscribe = () => () => {};

type SortField = 'date' | 'amount' | 'title' | 'category' | 'paymentMethod' | 'time';
type SortOrder = 'asc' | 'desc';

interface MiniTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { label: string; amount: number; count: number } }>;
}

function MiniTooltip({ active, payload }: MiniTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="p-2.5 rounded-lg border border-border shadow-lg bg-card/95 backdrop-blur-md text-xs text-foreground min-w-[140px] space-y-1">
        <p className="font-semibold text-foreground border-b border-border/60 pb-1">{item.label}</p>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Spent:</span>
          <span className="font-bold text-foreground font-mono">
            ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Entries:</span>
          <span className="font-mono">{item.count}</span>
        </div>
      </div>
    );
  }
  return null;
}

export default function ExpenseTable({ expenses }: { expenses: Expense[] }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPayment, setSelectedPayment] = useState<string>('All');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showMiniChart, setShowMiniChart] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const gridStroke = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const axisColor = isDark ? '#94a3b8' : '#64748b';
  const primaryStroke = isDark ? '#818cf8' : '#4f46e5';

  // Unique categories and payment methods
  const categories = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      if (e.category) set.add(e.category.trim());
    });
    return ['All', ...Array.from(set).sort()];
  }, [expenses]);

  const paymentMethods = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      if (e.paymentMethod) set.add(e.paymentMethod.trim());
    });
    return ['All', ...Array.from(set).sort()];
  }, [expenses]);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    return expenses.filter((e) => {
      // Search
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        (e.category && e.category.toLowerCase().includes(q)) ||
        (e.paymentMethod && e.paymentMethod.toLowerCase().includes(q)) ||
        (e.expenseDate && e.expenseDate.toLowerCase().includes(q)) ||
        (e.amount && e.amount.toString().includes(q));

      if (!matchSearch) return false;

      // Category
      if (selectedCategory !== 'All' && e.category !== selectedCategory) {
        return false;
      }

      // Payment method
      if (selectedPayment !== 'All' && e.paymentMethod !== selectedPayment) {
        return false;
      }

      // Time filter
      if (timeFilter !== 'all') {
        const d = new Date(e.expenseDate);
        if (isNaN(d.getTime())) return true;

        if (timeFilter === 'this_month') {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          if (d < monthStart || d > today) return false;
        } else if (timeFilter === 'last_month') {
          const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          if (d < lastMonthStart || d > lastMonthEnd) return false;
        } else if (timeFilter === 'last_30_days') {
          const past30 = new Date(today);
          past30.setDate(today.getDate() - 30);
          past30.setHours(0, 0, 0, 0);
          if (d < past30 || d > today) return false;
        } else if (timeFilter === 'last_7_days') {
          const past7 = new Date(today);
          past7.setDate(today.getDate() - 7);
          past7.setHours(0, 0, 0, 0);
          if (d < past7 || d > today) return false;
        }
      }

      return true;
    });
  }, [expenses, search, selectedCategory, selectedPayment, timeFilter]);

  // Sort expenses
  const sortedExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => {
      let comparison = 0;

      if (sortField === 'date') {
        const dateA = new Date(a.expenseDate || 0).getTime();
        const dateB = new Date(b.expenseDate || 0).getTime();
        comparison = dateA - dateB;
      } else if (sortField === 'time') {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        comparison = timeA - timeB;
      } else if (sortField === 'amount') {
        const amtA = parseFloat(a.amount || '0');
        const amtB = parseFloat(b.amount || '0');
        comparison = amtA - amtB;
      } else if (sortField === 'title') {
        comparison = (a.title || '').localeCompare(b.title || '');
      } else if (sortField === 'category') {
        comparison = (a.category || '').localeCompare(b.category || '');
      } else if (sortField === 'paymentMethod') {
        comparison = (a.paymentMethod || '').localeCompare(b.paymentMethod || '');
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredExpenses, sortField, sortOrder]);

  // Aggregated totals
  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (parseFloat(e.amount || '0') || 0), 0);
  }, [filteredExpenses]);

  const avgFilteredAmount = useMemo(() => {
    if (filteredExpenses.length === 0) return 0;
    return totalFilteredAmount / filteredExpenses.length;
  }, [filteredExpenses, totalFilteredAmount]);

  // Mini Chart Data
  const miniChartData = useMemo(() => {
    if (!showMiniChart || filteredExpenses.length === 0) return [];
    const dayMap: Record<string, { amount: number; count: number; dateObj: Date }> = {};

    filteredExpenses.forEach((exp) => {
      const d = new Date(exp.expenseDate);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const val = parseFloat(exp.amount || '0') || 0;

      if (!dayMap[key]) {
        dayMap[key] = { amount: 0, count: 0, dateObj: d };
      }
      dayMap[key].amount += val;
      dayMap[key].count += 1;
    });

    const sortedKeys = Object.keys(dayMap).sort((a, b) => a.localeCompare(b));
    return sortedKeys.map((key) => ({
      key,
      label: dayMap[key].dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      amount: parseFloat(dayMap[key].amount.toFixed(2)),
      count: dayMap[key].count,
    }));
  }, [filteredExpenses, showMiniChart]);

  // Pagination calculation
  const totalPages = Math.ceil(sortedExpenses.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedExpenses = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return sortedExpenses.slice(startIndex, startIndex + pageSize);
  }, [sortedExpenses, safeCurrentPage, pageSize]);

  // Handle Sort Toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'title' || field === 'category' ? 'asc' : 'desc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp size={12} className="text-primary font-bold" />
    ) : (
      <ArrowDown size={12} className="text-primary font-bold" />
    );
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) return;

    const headers = ['Date', 'Time Added', 'Category', 'Title', 'Amount (INR)', 'Payment Method', 'ID'];
    const rows = filteredExpenses.map((e) => {
      const d = new Date(e.expenseDate);
      const formattedDate = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : e.expenseDate;
      const createdD = new Date(e.createdAt);
      const timeStr = !isNaN(createdD.getTime()) ? createdD.toLocaleTimeString() : '';

      return [
        `"${formattedDate}"`,
        `"${timeStr}"`,
        `"${(e.category || '').replace(/"/g, '""')}"`,
        `"${(e.title || '').replace(/"/g, '""')}"`,
        parseFloat(e.amount || '0').toFixed(2),
        `"${(e.paymentMethod || '').replace(/"/g, '""')}"`,
        `"${e.id}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `expenses_export_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (createdAtStr: string) => {
    if (!createdAtStr) return '—';
    const d = new Date(createdAtStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedPayment('All');
    setTimeFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = search || selectedCategory !== 'All' || selectedPayment !== 'All' || timeFilter !== 'all';

  return (
    <div className="space-y-4">
      {/* Table Toolbar: Search, Filters, Mini Graph Toggle, Export */}
      <div className="flex flex-col gap-3 bg-muted/20 border border-border p-3.5 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <input
              type="text"
              placeholder="Search by title, category, payment..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Filter */}
            <div className="relative">
              <select
                aria-label="Filter by category"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-2.5 pr-7 py-1.5 text-xs bg-card border border-border rounded-lg text-foreground font-medium appearance-none hover:bg-muted/70 transition-colors cursor-pointer"
              >
                <option value="All">All Categories ({categories.length - 1})</option>
                {categories
                  .filter((c) => c !== 'All')
                  .map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
              </select>
              <Tag size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            {/* Payment Method Filter */}
            <div className="relative">
              <select
                aria-label="Filter by payment method"
                value={selectedPayment}
                onChange={(e) => {
                  setSelectedPayment(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-2.5 pr-7 py-1.5 text-xs bg-card border border-border rounded-lg text-foreground font-medium appearance-none hover:bg-muted/70 transition-colors cursor-pointer"
              >
                <option value="All">All Payment ({paymentMethods.length - 1})</option>
                {paymentMethods
                  .filter((p) => p !== 'All')
                  .map((pm) => (
                    <option key={pm} value={pm}>
                      {pm}
                    </option>
                  ))}
              </select>
              <CreditCard size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            {/* Time Period Filter */}
            <div className="relative">
              <select
                aria-label="Filter by time period"
                value={timeFilter}
                onChange={(e) => {
                  setTimeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-2.5 pr-7 py-1.5 text-xs bg-card border border-border rounded-lg text-foreground font-medium appearance-none hover:bg-muted/70 transition-colors cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="last_7_days">Last 7 Days</option>
              </select>
              <Calendar size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            {/* Reset Filters button if any active */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Reset all filters"
              >
                Reset
              </button>
            )}

            {/* Mini Chart Toggle */}
            <button
              type="button"
              onClick={() => setShowMiniChart(!showMiniChart)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                showMiniChart
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-card border-border text-foreground hover:bg-muted'
              }`}
              title="Toggle inline trend chart"
            >
              <TrendingUp size={13} />
              <span>{showMiniChart ? 'Hide Trend' : 'Show Trend'}</span>
            </button>

            {/* Export CSV button */}
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredExpenses.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-card border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
              title="Export filtered records as CSV"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Summary Stats Pill Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60 text-xs">
          <div className="flex items-center gap-3 text-muted-foreground flex-wrap">
            <span>
              Showing <strong className="text-foreground">{sortedExpenses.length}</strong> of{' '}
              <strong className="text-foreground">{expenses.length}</strong> total records
            </span>
            <span>•</span>
            <span>
              Filtered Total:{' '}
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                ₹{totalFilteredAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </span>
            {filteredExpenses.length > 0 && (
              <>
                <span>•</span>
                <span>
                  Avg per entry:{' '}
                  <strong className="text-foreground font-mono">
                    ₹{avgFilteredAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </span>
              </>
            )}
          </div>

          {/* Rows per page selector */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Rows:</span>
            <select
              aria-label="Rows per page"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-0.5 text-xs bg-background border border-border rounded text-foreground cursor-pointer"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Optional Mini Trend Graph Preview */}
      {showMiniChart && (
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <TrendingUp size={14} className="text-primary" />
              Filtered Spend Trend ({miniChartData.length} active days)
            </h4>
            <span className="text-[11px] text-muted-foreground font-mono">
              ₹{totalFilteredAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          {miniChartData.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No trend data available for current filter.</p>
          ) : (
            <div className="h-[140px] sm:h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={miniChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="miniTableGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={primaryStroke} stopOpacity={isDark ? 0.35 : 0.25} />
                      <stop offset="95%" stopColor={primaryStroke} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="label" stroke={axisColor} tick={{ fill: axisColor, fontSize: 10 }} />
                  <YAxis
                    stroke={axisColor}
                    tick={{ fill: axisColor, fontSize: 10 }}
                    tickFormatter={(val) => (val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`)}
                  />
                  <Tooltip content={<MiniTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke={primaryStroke}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#miniTableGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/40 text-muted-foreground text-xs border-b border-border select-none">
              <tr>
                <th
                  onClick={() => handleSort('date')}
                  className="px-5 py-3 font-medium cursor-pointer hover:text-foreground transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    <span>Expense Date</span>
                    {getSortIcon('date')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('time')}
                  className="px-5 py-3 font-medium cursor-pointer hover:text-foreground transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} />
                    <span>Added Time</span>
                    {getSortIcon('time')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('category')}
                  className="px-5 py-3 font-medium cursor-pointer hover:text-foreground transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Category</span>
                    {getSortIcon('category')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('title')}
                  className="px-5 py-3 font-medium cursor-pointer hover:text-foreground transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Title / Description</span>
                    {getSortIcon('title')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('amount')}
                  className="px-5 py-3 font-medium text-right cursor-pointer hover:text-foreground transition-colors group"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Amount</span>
                    {getSortIcon('amount')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('paymentMethod')}
                  className="px-5 py-3 font-medium cursor-pointer hover:text-foreground transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Payment Method</span>
                    {getSortIcon('paymentMethod')}
                  </div>
                </th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {paginatedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-muted-foreground">
                    <Calendar className="mx-auto mb-2 opacity-40" size={28} />
                    <p className="text-sm">No expenses matched your criteria.</p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="mt-2 text-xs text-primary hover:underline cursor-pointer"
                      >
                        Clear filters and search
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="hover:bg-muted/40 transition-colors group"
                  >
                    {/* Expense Date */}
                    <td className="px-5 py-3 text-foreground font-medium text-xs">
                      {formatDate(expense.expenseDate)}
                    </td>

                    {/* Added Time */}
                    <td className="px-5 py-3 text-muted-foreground font-mono text-xs">
                      {formatTime(expense.createdAt)}
                    </td>

                    {/* Category */}
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted border border-border text-foreground">
                        {expense.category || 'General'}
                      </span>
                    </td>

                    {/* Title */}
                    <td className="px-5 py-3">
                      <span className="font-semibold text-foreground text-xs sm:text-sm">
                        {expense.title}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-3 text-right font-semibold font-mono text-xs sm:text-sm text-foreground">
                      ₹{parseFloat(expense.amount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Payment Method */}
                    <td className="px-5 py-3 text-muted-foreground text-xs">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        {expense.paymentMethod || 'Not Specified'}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/expenses/${expense.id}`}
                        className="inline-flex items-center justify-center p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        title="View or edit details"
                      >
                        <ArrowRight size={15} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {sortedExpenses.length > 0 && (
          <div className="p-3 sm:p-4 bg-muted/20 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground">
              Showing{' '}
              <strong className="text-foreground">
                {(safeCurrentPage - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-foreground">
                {Math.min(safeCurrentPage * pageSize, sortedExpenses.length)}
              </strong>{' '}
              of <strong className="text-foreground">{sortedExpenses.length}</strong> records
            </span>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded-md border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="First Page"
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded-md border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft size={14} />
              </button>

              <span className="px-3 py-1 font-medium text-foreground bg-muted rounded-md border border-border">
                Page {safeCurrentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={safeCurrentPage >= totalPages}
                className="p-1.5 rounded-md border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Next Page"
              >
                <ChevronRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage >= totalPages}
                className="p-1.5 rounded-md border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Last Page"
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
