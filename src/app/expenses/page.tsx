'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowRight, 
  Megaphone, 
  Calendar, 
  Clock, 
  FileText, 
  Pencil, 
  Check, 
  X, 
  ArrowUpDown, 
  Loader2,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Expense {
  id: string;
  expenseDate: string;
  createdAt: string;
  category: string;
  title: string;
  amount: string;
  paymentMethod: string;
}

interface DateNote {
  id: string;
  date: string;
  note: string;
  updatedAt: string;
}

interface MonthGroup {
  monthKey: string;
  monthLabel: string;
  isCurrent: boolean;
  totalAmount: number;
  totalRecords: number;
  dateKeys: string[];
  daysCount: number;
}

// Format date into a canonical key YYYY-MM-DD
function parseDateKey(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr.substring(0, 10);
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Extract month key YYYY-MM from dateKey YYYY-MM-DD
function parseMonthKeyFromDate(dateKey: string): string {
  if (!dateKey || dateKey.length < 7) return 'unknown';
  return dateKey.substring(0, 7);
}

// Format month key into display label and check if current month
function formatDisplayMonth(monthKey: string): { label: string; isCurrent: boolean } {
  if (!monthKey || monthKey === 'unknown') return { label: 'Uncategorized Month', isCurrent: false };
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  if (isNaN(year) || isNaN(month)) return { label: monthKey, isCurrent: false };
  
  const d = new Date(year, month - 1, 1);
  const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); // e.g. "October 2026", "March 2026"

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const isCurrent = monthKey === currentMonthKey;

  return { label, isCurrent };
}

// Format date key into user-friendly display string
function formatDisplayDate(dateKey: string): { main: string; relative?: string } {
  if (!dateKey) return { main: 'Unknown Date' };
  const [year, month, day] = dateKey.split('-').map(Number);
  const d = new Date(year, month - 1, day);

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  let relative: string | undefined;
  if (dateKey === todayKey) relative = 'Today';
  else if (dateKey === yesterdayKey) relative = 'Yesterday';

  const main = d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }); // e.g. "Tue, 29 Sep 2026"

  return { main, relative };
}

// Format time from createdAt
function formatAddedTime(createdAtStr: string): string {
  if (!createdAtStr) return '—';
  const d = new Date(createdAtStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dateNotes, setDateNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showFilter, setShowFilter] = useState(false);
  const [timeSortOrder, setTimeSortOrder] = useState<'desc' | 'asc'>('desc'); // 'desc' = newest added first

  // Collapsed / Expanded state - default is collapsed (empty object)
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  // Editing state for daily notes
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');
  const [savingNoteDate, setSavingNoteDate] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [expRes, notesRes] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/expenses/notes')
      ]);

      if (!expRes.ok) throw new Error('Failed to fetch expenses');

      const expData: Expense[] = await expRes.json();
      setExpenses(expData);

      if (notesRes.ok) {
        const notesData: DateNote[] = await notesRes.json();
        const notesMap: Record<string, string> = {};
        if (Array.isArray(notesData)) {
          notesData.forEach(item => {
            if (item.date && item.note) {
              notesMap[item.date] = item.note;
            }
          });
        }
        setDateNotes(notesMap);
      }
    } catch (error: unknown) {
      console.error(error);
      toast.error('Failed to load expense data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleStartEditNote = (dateKey: string) => {
    const monthKey = parseMonthKeyFromDate(dateKey);
    // Ensure both the month and the date sections are expanded when editing note
    setExpandedMonths(prev => ({ ...prev, [monthKey]: true }));
    setExpandedDates(prev => ({ ...prev, [dateKey]: true }));
    setEditingDate(dateKey);
    setTempNote(dateNotes[dateKey] || '');
  };

  const handleCancelEditNote = () => {
    setEditingDate(null);
    setTempNote('');
  };

  const handleSaveNote = async (dateKey: string) => {
    try {
      setSavingNoteDate(dateKey);
      const res = await fetch('/api/expenses/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateKey,
          note: tempNote.trim()
        })
      });

      if (!res.ok) {
        throw new Error('Failed to save note');
      }

      setDateNotes(prev => ({
        ...prev,
        [dateKey]: tempNote.trim()
      }));

      toast.success(tempNote.trim() ? 'Daily note saved' : 'Daily note removed');
      setEditingDate(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save daily note');
    } finally {
      setSavingNoteDate(null);
    }
  };

  const toggleExpandMonth = (monthKey: string) => {
    setExpandedMonths(prev => ({
      ...prev,
      [monthKey]: !prev[monthKey]
    }));
  };

  const toggleExpandDate = (dateKey: string) => {
    setExpandedDates(prev => ({
      ...prev,
      [dateKey]: !prev[dateKey]
    }));
  };

  const categories = ['All', ...Array.from(new Set(expenses.map(e => e.category).filter(Boolean)))];

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = 
      expense.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (expense.category && expense.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (expense.paymentMethod && expense.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesCategory = selectedCategory === 'All' || expense.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Group filtered expenses by date
  const dateGroupedExpenses: Record<string, Expense[]> = {};
  for (const exp of filteredExpenses) {
    const dateKey = parseDateKey(exp.expenseDate);
    if (!dateGroupedExpenses[dateKey]) {
      dateGroupedExpenses[dateKey] = [];
    }
    dateGroupedExpenses[dateKey].push(exp);
  }

  // Within each date group, sort expenses by adding time (createdAt)
  for (const dateKey of Object.keys(dateGroupedExpenses)) {
    dateGroupedExpenses[dateKey].sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeSortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }

  // Group dates into months
  const monthGroupsMap: Record<string, MonthGroup> = {};
  for (const dateKey of Object.keys(dateGroupedExpenses)) {
    const monthKey = parseMonthKeyFromDate(dateKey);
    const items = dateGroupedExpenses[dateKey];
    const daySum = items.reduce((sum, item) => sum + parseFloat(item.amount || '0'), 0);

    if (!monthGroupsMap[monthKey]) {
      const { label, isCurrent } = formatDisplayMonth(monthKey);
      monthGroupsMap[monthKey] = {
        monthKey,
        monthLabel: label,
        isCurrent,
        totalAmount: 0,
        totalRecords: 0,
        dateKeys: [],
        daysCount: 0
      };
    }

    monthGroupsMap[monthKey].totalAmount += daySum;
    monthGroupsMap[monthKey].totalRecords += items.length;
    monthGroupsMap[monthKey].dateKeys.push(dateKey);
  }

  // Sort months descending (latest month first)
  const sortedMonthKeys = Object.keys(monthGroupsMap).sort((a, b) => b.localeCompare(a));

  // Sort dates within each month descending (latest day first)
  for (const mKey of sortedMonthKeys) {
    monthGroupsMap[mKey].dateKeys.sort((a, b) => b.localeCompare(a));
    monthGroupsMap[mKey].daysCount = monthGroupsMap[mKey].dateKeys.length;
  }

  // Determine current month key YYYY-MM
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Current month date keys (ungrouped, listed directly)
  const currentMonthDateKeys = monthGroupsMap[currentMonthKey]?.dateKeys || [];

  // Ended / Past month keys (grouped by month)
  const pastMonthKeys = sortedMonthKeys.filter(mKey => mKey !== currentMonthKey);

  const areAnyExpanded = 
    Object.values(expandedMonths).some(Boolean) || 
    Object.values(expandedDates).some(Boolean);

  const toggleCollapseAll = () => {
    if (areAnyExpanded) {
      setExpandedMonths({});
      setExpandedDates({});
    } else {
      const allMonths: Record<string, boolean> = {};
      pastMonthKeys.forEach(m => { allMonths[m] = true; });
      const allDates: Record<string, boolean> = {};
      for (const m of sortedMonthKeys) {
        monthGroupsMap[m].dateKeys.forEach(d => { allDates[d] = true; });
      }
      setExpandedMonths(allMonths);
      setExpandedDates(allDates);
    }
  };

  const calculateTotal = () => {
    return filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || '0'), 0).toFixed(2);
  };

  const totalDaysTracked = Object.keys(dateGroupedExpenses).length;

  // Reusable Date Card Component
  const renderDateCard = (dateKey: string) => {
    const items = dateGroupedExpenses[dateKey];
    if (!items || items.length === 0) return null;
    const { main: displayDate, relative } = formatDisplayDate(dateKey);
    const dayTotal = items.reduce((sum, item) => sum + parseFloat(item.amount || '0'), 0).toFixed(2);
    const currentNote = dateNotes[dateKey];
    const isEditingThisNote = editingDate === dateKey;
    const isSavingThisNote = savingNoteDate === dateKey;
    const isDateExpanded = Boolean(expandedDates[dateKey]);

    return (
      <div 
        key={dateKey} 
        className="bg-zinc-900/60 border border-white/10 rounded-xl overflow-hidden shadow-sm transition-all"
      >
        {/* Date Group Header (Clickable to Toggle Collapse) */}
        <div 
          onClick={() => toggleExpandDate(dateKey)}
          className={`p-3.5 sm:p-4 bg-zinc-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-zinc-800/80 transition-colors select-none ${
            isDateExpanded ? 'border-b border-white/10' : ''
          }`}
        >
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Date chevron indicator */}
            <div className="text-white/50 hover:text-white transition-colors">
              {isDateExpanded ? (
                <ChevronDown size={17} />
              ) : (
                <ChevronRight size={17} />
              )}
            </div>

            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-white/60" />
              <span className="font-semibold text-sm sm:text-base text-white">{displayDate}</span>
            </div>

            {relative && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {relative}
              </span>
            )}

            <span className="text-xs text-white/40">
              • {items.length} {items.length === 1 ? 'record' : 'records'}
            </span>

            {/* When collapsed, if a note exists, show a mini preview pill */}
            {!isDateExpanded && currentNote && (
              <span 
                className="hidden sm:inline-flex items-center gap-1.5 text-xs text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 max-w-xs truncate"
                title={currentNote}
              >
                <FileText size={12} className="shrink-0 text-amber-400" />
                <span className="truncate">{currentNote}</span>
              </span>
            )}
          </div>

          {/* Right: Daily total and Note edit action */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-white/40 block">Daily Total</span>
              <span className="font-bold text-sm sm:text-base text-white">₹{dayTotal}</span>
            </div>

            {!isEditingThisNote && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartEditNote(dateKey);
                }}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                  currentNote 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20' 
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                }`}
                title={currentNote ? 'Edit note for this date' : 'Add note for this date'}
              >
                <FileText size={13} />
                <span>{currentNote ? 'Edit Note' : '+ Note'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Area: Collapsible Date Table & Notes */}
        {isDateExpanded && (
          <div>
            {/* Daily Note Display / Editor Section */}
            {isEditingThisNote ? (
              <div className="p-3 bg-amber-500/5 border-b border-amber-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-amber-300 flex items-center gap-1.5">
                    <FileText size={14} /> Note for {displayDate}
                  </span>
                  <span className="text-[11px] text-white/40">Visible to team</span>
                </div>
                <textarea
                  value={tempNote}
                  onChange={(e) => setTempNote(e.target.value)}
                  placeholder="Add overall notes for this date (e.g., Shoot in Calicut, travel expenses, client dinner)..."
                  rows={2}
                  autoFocus
                  className="w-full bg-black/60 border border-amber-500/30 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-400 placeholder-white/30 resize-none transition-colors"
                />
                <div className="flex justify-end items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEditNote}
                    disabled={isSavingThisNote}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white bg-white/5 border border-white/10 transition-colors"
                  >
                    <X size={13} /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveNote(dateKey)}
                    disabled={isSavingThisNote}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-black bg-amber-400 hover:bg-amber-300 transition-colors"
                  >
                    {isSavingThisNote ? (
                      <>
                        <Loader2 size={13} className="animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Check size={13} /> Save Note
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : currentNote ? (
              <div className="p-3 bg-amber-500/5 border-b border-white/5 flex items-start justify-between gap-3 text-sm">
                <div className="flex items-start gap-2 text-amber-200/90">
                  <FileText size={15} className="mt-0.5 flex-shrink-0 text-amber-400" />
                  <p className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                    {currentNote}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartEditNote(dateKey)}
                  className="text-white/40 hover:text-amber-300 transition-colors p-1"
                  title="Edit date note"
                >
                  <Pencil size={13} />
                </button>
              </div>
            ) : null}

            {/* Expenses Table for this Date */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white/[0.02] text-white/50 text-xs border-b border-white/5">
                  <tr>
                    <th className="px-6 py-2.5 font-medium flex items-center gap-1">
                      <Clock size={12} />
                      Adding Time
                    </th>
                    <th className="px-6 py-2.5 font-medium">Category</th>
                    <th className="px-6 py-2.5 font-medium">Title</th>
                    <th className="px-6 py-2.5 font-medium text-right">Amount</th>
                    <th className="px-6 py-2.5 font-medium">Payment</th>
                    <th className="px-6 py-2.5 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map(expense => (
                    <tr 
                      key={expense.id} 
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      <td className="px-6 py-3.5 text-white/70 font-mono text-xs">
                        {formatAddedTime(expense.createdAt)}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="bg-white/10 px-2 py-0.5 rounded text-xs text-white/80">
                          {expense.category || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-medium text-white">{expense.title}</span>
                      </td>
                      <td className="px-6 py-3.5 text-right font-medium text-white">
                        ₹{parseFloat(expense.amount || '0').toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 text-white/70 text-xs">
                        {expense.paymentMethod || 'N/A'}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <Link 
                          href={`/expenses/${expense.id}`} 
                          className="inline-flex items-center justify-center text-white/40 group-hover:text-white transition-colors"
                        >
                          <ArrowRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header */}
      <div className="flex-none flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">Expenses</h1>
          <p className="text-xs sm:text-sm text-white/60 mt-1">Manage and track your business expenses grouped by date</p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Link
            href="/meta-ads"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-2.5 min-h-[44px] rounded-xl font-medium hover:bg-blue-500/20 transition-colors text-xs sm:text-sm"
          >
            <Megaphone size={16} />
            <span>Meta Ads</span>
          </Link>
          <Link
            href="/expenses/add"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-white text-black px-4 py-2.5 min-h-[44px] rounded-xl font-medium hover:bg-white/90 transition-colors text-xs sm:text-sm shadow-sm"
          >
            <Plus size={16} />
            <span>Add Expense</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Top Metrics Cards */}
          <div className="flex-none grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5">
              <p className="text-xs sm:text-sm text-white/60 mb-1">Total Expenses</p>
              <p className="text-xl sm:text-2xl font-bold">₹{calculateTotal()}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5">
              <p className="text-xs sm:text-sm text-white/60 mb-1">Total Records</p>
              <p className="text-xl sm:text-2xl font-bold">{filteredExpenses.length}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5">
              <p className="text-xs sm:text-sm text-white/60 mb-1">Days Tracked</p>
              <p className="text-xl sm:text-2xl font-bold">{totalDaysTracked}</p>
            </div>
          </div>

          {/* Main Card with Controls & Expenses */}
          <div className="flex-1 min-h-0 flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            {/* Filter & Search Bar */}
            <div className="flex-none p-3 sm:p-4 border-b border-white/10 flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-between bg-black/50">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                <input 
                  type="text" 
                  placeholder="Search expenses..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 min-h-[44px] text-base md:text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>
              
              <div className="flex items-center flex-wrap gap-2">
                {/* Collapse / Expand All Toggle */}
                {totalDaysTracked > 0 && (
                  <button
                    onClick={toggleCollapseAll}
                    title={areAnyExpanded ? 'Collapse all' : 'Expand all'}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm px-3 py-2 min-h-[40px] rounded-xl border bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <ChevronsUpDown size={15} />
                    <span>{areAnyExpanded ? 'Collapse All' : 'Expand All'}</span>
                  </button>
                )}

                {/* Adding Time Sort Order Toggle */}
                <button
                  onClick={() => setTimeSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  title="Toggle order by adding time"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm px-3 py-2 min-h-[40px] rounded-xl border bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ArrowUpDown size={15} />
                  <span>Time: {timeSortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
                </button>

                {/* Category Filter Dropdown */}
                <div className="relative flex-1 sm:flex-initial">
                  <button 
                    onClick={() => setShowFilter(!showFilter)}
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 min-h-[40px] rounded-xl border transition-colors ${showFilter || selectedCategory !== 'All' ? 'bg-white/10 border-white/20 text-white' : 'text-white/60 hover:text-white bg-white/5 border-white/10'}`}
                  >
                    <Filter size={15} />
                    <span>{selectedCategory !== 'All' ? selectedCategory : 'Category'}</span>
                  </button>

                  {showFilter && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-xl z-30 py-1 max-h-60 overflow-y-auto">
                      {categories.map(category => (
                        <button
                          key={category as string}
                          onClick={() => {
                            setSelectedCategory(category as string);
                            setShowFilter(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 min-h-[38px] text-xs sm:text-sm hover:bg-white/5 transition-colors ${selectedCategory === category ? 'text-white bg-white/5 font-medium' : 'text-white/70'}`}
                        >
                          {category as string}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Scrollable Grouped Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
              {totalDaysTracked === 0 ? (
                <div className="py-16 text-center text-white/40">
                  <Calendar className="mx-auto mb-3 opacity-40" size={32} />
                  <p>No expenses found.</p>
                  <p className="text-xs text-white/30 mt-1">Try adjusting your search or click &apos;Add Expense&apos; to create one.</p>
                </div>
              ) : (
                <>
                  {/* 1. Current Month Dates (Direct date cards, collapsed by default, not wrapped in a month box) */}
                  {currentMonthDateKeys.map(dateKey => renderDateCard(dateKey))}

                  {/* Divider if both current month dates and past months exist */}
                  {currentMonthDateKeys.length > 0 && pastMonthKeys.length > 0 && (
                    <div className="pt-2 pb-1 flex items-center gap-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-white/40">Ended Months</span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>
                  )}

                  {/* 2. Ended/Past Months (Grouped by month accordion, collapsed by default) */}
                  {pastMonthKeys.map(monthKey => {
                    const monthGroup = monthGroupsMap[monthKey];
                    const isMonthExpanded = Boolean(expandedMonths[monthKey]);

                    return (
                      <div 
                        key={monthKey}
                        className="bg-zinc-950/70 border border-white/10 rounded-2xl overflow-hidden shadow-lg transition-all"
                      >
                        {/* Month Header (Clickable to Toggle Month Expansion) */}
                        <div
                          onClick={() => toggleExpandMonth(monthKey)}
                          className={`p-4 sm:p-4.5 bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-zinc-900/50 hover:bg-zinc-800/80 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none transition-colors ${
                            isMonthExpanded ? 'border-b border-white/10' : ''
                          }`}
                        >
                          <div className="flex items-center flex-wrap gap-2.5">
                            <div className="text-white/60 hover:text-white transition-colors">
                              {isMonthExpanded ? (
                                <ChevronDown size={20} />
                              ) : (
                                <ChevronRight size={20} />
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Calendar size={18} className="text-blue-400" />
                              <span className="font-bold text-lg text-white">{monthGroup.monthLabel}</span>
                            </div>

                            <span className="text-xs text-white/50 bg-white/5 px-2.5 py-0.5 rounded-md border border-white/5">
                              {monthGroup.totalRecords} {monthGroup.totalRecords === 1 ? 'record' : 'records'} • {monthGroup.daysCount} {monthGroup.daysCount === 1 ? 'day' : 'days'}
                            </span>
                          </div>

                          {/* Monthly total */}
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-xs text-white/40 block">Monthly Total</span>
                              <span className="font-bold text-lg text-emerald-400">₹{monthGroup.totalAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Month Content: List of Dates in this Past Month (when expanded) */}
                        {isMonthExpanded && (
                          <div className="p-3 sm:p-4 space-y-3.5 bg-black/40">
                            {monthGroup.dateKeys.map(dateKey => renderDateCard(dateKey))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

