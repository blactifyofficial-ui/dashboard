'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  TrendingUp, 
  Plus, 
  CheckCircle2, 
  ExternalLink, 
  Trash2, 
  Search, 
  Check, 
  Clock,
  Wallet,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/context/AuthContext';
import AccessDenied from '@/components/AccessDenied';

interface MetaAdsSettings {
  id: string;
  dailyBudget: number;
  days?: number;
  weeklyBudget: number;
  monthlyBudgetEstimate: number;
  currency: string;
  notes?: string | null;
  updatedAt?: string;
}

interface PaymentMethod {
  id: string;
  code: string;
  name: string;
}

interface MetaAdsTransaction {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  dailyBudget: string;
  calculatedWeeklyBudget: string;
  amountPaid: string;
  paymentDate: string;
  paymentMethodId: string;
  paymentMethodName?: string;
  paymentMethodCode?: string;
  status: string;
  referenceNumber?: string | null;
  notes?: string | null;
  expenseId?: string | null;
  creatorName?: string | null;
  createdAt: string;
}

interface SummaryData {
  dailyBudget: number;
  days?: number;
  weeklyBudget: number;
  monthlyBudgetEstimate: number;
  totalPaid: number;
  thisMonthPaid: number;
  transactionCount: number;
}

// Format a local Date into YYYY-MM-DD without UTC timezone skew
const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function MetaAdsPage() {
  const { hasPermission } = useAuth();
  const canViewAds = hasPermission('meta_ads:view');
  const canEditAds = hasPermission('meta_ads:edit');

  const [loading, setLoading] = useState(true);
  const [savingBudget, setSavingBudget] = useState(false);
  const [settings, setSettings] = useState<MetaAdsSettings | null>(null);
  const [transactions, setTransactions] = useState<MetaAdsTransaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);

  // Daily budget input state
  const [dailyBudgetInput, setDailyBudgetInput] = useState<string>('0');
  const [daysInput, setDaysInput] = useState<string>('7');
  const [budgetNotes, setBudgetNotes] = useState<string>('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Payment Modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  
  // Payment Form state
  const [paymentPreset, setPaymentPreset] = useState<'current_week' | 'previous_week' | 'custom'>('current_week');
  const [weekStartDate, setWeekStartDate] = useState('');
  const [weekEndDate, setWeekEndDate] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [syncToExpenses, setSyncToExpenses] = useState(true);

  // Active budget and period counts
  const currentDaysNum = Math.max(1, parseInt(daysInput, 10) || (settings?.days || 7));
  const currentDailyBudgetNum = parseFloat(dailyBudgetInput) || (settings?.dailyBudget || 0);

  // Delete modal state
  const [txToDelete, setTxToDelete] = useState<MetaAdsTransaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper: Get start & end of a standard ISO week (Monday to Sunday) in local calendar dates
  const getWeekRange = (weeksAgo: number = 0) => {
    const now = new Date();
    const currentDay = now.getDay();
    // Monday is 1, Sunday is 0 -> distance to Monday:
    const distanceToMonday = (currentDay + 6) % 7;
    
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday - (weeksAgo * 7));
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);

    return {
      start: formatLocalDate(monday),
      end: formatLocalDate(sunday)
    };
  };

  // Helper: Get period range for custom day counts (defaults to getWeekRange if 7 days)
  const getPeriodRange = (periodsAgo: number = 0, numDays: number = 7) => {
    if (numDays === 7) {
      return getWeekRange(periodsAgo);
    }
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (periodsAgo * numDays));
    const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - (numDays - 1));
    return {
      start: formatLocalDate(start),
      end: formatLocalDate(end)
    };
  };

  // Helper: Calculate days between dates inclusively using UTC to prevent DST/timezone shifts
  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return currentDaysNum;
    const [sy, sm, sd] = start.split('-').map(Number);
    const [ey, em, ed] = end.split('-').map(Number);
    if (!sy || !sm || !sd || !ey || !em || !ed) return currentDaysNum;

    const utcStart = Date.UTC(sy, sm - 1, sd);
    const utcEnd = Date.UTC(ey, em - 1, ed);

    if (utcEnd < utcStart) return 1;

    const diffDays = Math.round((utcEnd - utcStart) / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  };

  // Fetch data
  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (!isInitial) setLoading(true);
      const res = await fetch('/api/meta-ads');
      if (!res.ok) throw new Error('Failed to fetch Meta Ads data');
      const data = await res.json();

      setSettings(data.settings);
      setTransactions(data.transactions || []);
      setPaymentMethods(data.paymentMethods || []);
      setSummary(data.summary);

      if (data.settings) {
        setDailyBudgetInput(data.settings.dailyBudget?.toString() || '0');
        setDaysInput(data.settings.days?.toString() || '7');
        setBudgetNotes(data.settings.notes || '');
      }

      if (data.paymentMethods?.length > 0) {
        const defaultMethod = data.paymentMethods.find((p: PaymentMethod) => p.code === 'UPI' || p.code === 'CARD') || data.paymentMethods[0];
        setPaymentMethodId(prev => prev || defaultMethod.id);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load Meta Ads data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData(true);
  }, [fetchData]);

  // Recalculate default payment amount based on daily budget and date range
  const calculatedDays = calculateDays(weekStartDate, weekEndDate);
  const calculatedBudgetForPeriod = useMemo(() => {
    return Math.round(currentDailyBudgetNum * calculatedDays);
  }, [currentDailyBudgetNum, calculatedDays]);

  // Handle Preset Selection in modal
  const handleSelectPreset = (preset: 'current_week' | 'previous_week' | 'custom') => {
    setPaymentPreset(preset);
    if (preset === 'current_week') {
      const range = getPeriodRange(0, currentDaysNum);
      setWeekStartDate(range.start);
      setWeekEndDate(range.end);
      const days = calculateDays(range.start, range.end);
      setAmountPaid(Math.round(currentDailyBudgetNum * days).toString());
    } else if (preset === 'previous_week') {
      const range = getPeriodRange(1, currentDaysNum);
      setWeekStartDate(range.start);
      setWeekEndDate(range.end);
      const days = calculateDays(range.start, range.end);
      setAmountPaid(Math.round(currentDailyBudgetNum * days).toString());
    }
  };

  const handleStartDateChange = (val: string) => {
    setWeekStartDate(val);
    setPaymentPreset('custom');
    const days = calculateDays(val, weekEndDate);
    setAmountPaid(Math.round(currentDailyBudgetNum * days).toString());
  };

  const handleEndDateChange = (val: string) => {
    setWeekEndDate(val);
    setPaymentPreset('custom');
    const days = calculateDays(weekStartDate, val);
    setAmountPaid(Math.round(currentDailyBudgetNum * days).toString());
  };

  // Open Payment Modal
  const handleOpenPaymentModal = () => {
    const range = getPeriodRange(0, currentDaysNum);
    setWeekStartDate(range.start);
    setWeekEndDate(range.end);
    setPaymentPreset('current_week');
    const days = calculateDays(range.start, range.end);
    const calc = Math.round(currentDailyBudgetNum * days);
    setAmountPaid(calc > 0 ? calc.toString() : '');
    setPaymentDate(formatLocalDate(new Date()));
    setReferenceNumber('');
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  // Handle Save Daily Budget
  const handleSaveBudget = async () => {
    const val = parseFloat(dailyBudgetInput);
    if (isNaN(val) || val < 0) {
      toast.error('Please enter a valid daily budget amount');
      return;
    }

    const daysVal = parseInt(daysInput, 10);
    if (isNaN(daysVal) || daysVal <= 0) {
      toast.error('Please enter a valid number of days (at least 1)');
      return;
    }

    try {
      setSavingBudget(true);
      const res = await fetch('/api/meta-ads/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyBudget: val,
          days: daysVal,
          notes: budgetNotes,
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update budget');
      }

      const data = await res.json();
      setSettings(data.settings);
      setSummary(prev => prev ? {
        ...prev,
        dailyBudget: data.settings.dailyBudget,
        days: data.settings.days,
        weeklyBudget: data.settings.weeklyBudget,
        monthlyBudgetEstimate: data.settings.monthlyBudgetEstimate,
      } : null);

      toast.success(`Daily budget set to ₹${val.toLocaleString('en-IN')} (${daysVal} Days Target: ₹${(val * daysVal).toLocaleString('en-IN')})`);
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
      else toast.error('An error occurred');
    } finally {
      setSavingBudget(false);
    }
  };


  // Handle Submit Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weekStartDate || !weekEndDate) {
      toast.error('Please specify the week date range');
      return;
    }
    const amountNum = parseFloat(amountPaid);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    if (!paymentMethodId) {
      toast.error('Please select a payment method');
      return;
    }

    try {
      setIsSubmittingPayment(true);
      const res = await fetch('/api/meta-ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekStartDate,
          weekEndDate,
          dailyBudget: currentDailyBudgetNum,
          calculatedWeeklyBudget: calculatedBudgetForPeriod,
          amountPaid: amountNum,
          paymentDate,
          paymentMethodId,
          referenceNumber,
          notes: paymentNotes,
          syncToExpenses,
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to record payment');
      }

      toast.success(
        syncToExpenses 
          ? 'Weekly budget marked as paid and synced to Expenses!' 
          : 'Weekly budget payment recorded successfully!'
      );
      setIsPaymentModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
      else toast.error('An error occurred while recording payment');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Handle Delete Transaction
  const handleConfirmDelete = async () => {
    if (!txToDelete) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/meta-ads/transactions/${txToDelete.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete transaction');
      }

      toast.success('Transaction and linked expense removed');
      setTxToDelete(null);
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
      else toast.error('Failed to delete transaction');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const q = searchQuery.toLowerCase();
      const refMatch = t.referenceNumber?.toLowerCase().includes(q) ?? false;
      const notesMatch = t.notes?.toLowerCase().includes(q) ?? false;
      const pmMatch = t.paymentMethodName?.toLowerCase().includes(q) ?? false;
      const amountMatch = t.amountPaid.includes(q);
      return refMatch || notesMatch || pmMatch || amountMatch;
    });
  }, [transactions, searchQuery]);

  const livePeriodBudget = currentDailyBudgetNum * currentDaysNum;
  const liveMonthlyBudget = currentDailyBudgetNum * 30;

  if (!canViewAds) {
    return <AccessDenied message="You do not have permission to view Meta Ads performance and budgets." />;
  }

  return (
    <div className="space-y-6 sm:space-y-8 relative z-10 pb-8 sm:pb-12">
      {/* Header - Matches Dashboard and Revenue header style */}
      <header className="flex-none flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">Meta Ads</h1>
          <p className="text-neutral-400 text-xs sm:text-sm md:text-base">
            Daily budget planning, weekly targets, and expense tracking
          </p>
        </div>
        {canEditAds && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleOpenPaymentModal}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black px-4 py-2.5 min-h-[44px] rounded-xl font-semibold hover:bg-neutral-200 active:bg-neutral-300 transition-colors text-xs sm:text-sm shadow-sm"
            >
              <Plus size={18} className="shrink-0" />
              <span>Mark {currentDaysNum === 7 ? 'Weekly' : `${currentDaysNum}-Day`} Budget Paid</span>
            </button>
          </div>
        )}
      </header>

      {loading && !settings ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Top Row: 4 Uniform KPI Cards - Matches Dashboard / RevenueCard grid & sizing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {/* Card 1: Daily Budget */}
            <div className="group bg-white/[0.03] border border-white/5 rounded-3xl p-5 sm:p-6 md:p-8 hover:bg-white/[0.06] transition-all duration-500 relative shadow-2xl flex flex-col justify-between">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-500 pointer-events-none"></div>
              <div className="flex items-center justify-between mb-2 md:mb-3 relative z-10">
                <h2 className="text-xs sm:text-sm font-medium text-neutral-400">Daily Budget</h2>
                <Calendar size={18} className="text-neutral-500 shrink-0" />
              </div>
              <div className="relative z-10">
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight truncate">
                  ₹{currentDailyBudgetNum.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-neutral-400 mt-1.5 sm:mt-2">Active daily target</p>
              </div>
            </div>

            {/* Card 2: Period Budget Target */}
            <div className="group bg-white/[0.03] border border-white/5 rounded-3xl p-5 sm:p-6 md:p-8 hover:bg-white/[0.06] transition-all duration-500 relative shadow-2xl flex flex-col justify-between">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-500 pointer-events-none"></div>
              <div className="flex items-center justify-between mb-2 md:mb-3 relative z-10">
                <h2 className="text-xs sm:text-sm font-medium text-neutral-400">
                  Target ({currentDaysNum} {currentDaysNum === 1 ? 'Day' : 'Days'})
                </h2>
                <TrendingUp size={18} className="text-neutral-500 shrink-0" />
              </div>
              <div className="relative z-10">
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight truncate">
                  ₹{livePeriodBudget.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-neutral-400 mt-1.5 sm:mt-2">
                  {currentDaysNum}d × ₹{currentDailyBudgetNum.toLocaleString('en-IN')}/day
                </p>
              </div>
            </div>

            {/* Card 3: Monthly Projection */}
            <div className="group bg-white/[0.03] border border-white/5 rounded-3xl p-5 sm:p-6 md:p-8 hover:bg-white/[0.06] transition-all duration-500 relative shadow-2xl flex flex-col justify-between">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-500 pointer-events-none"></div>
              <div className="flex items-center justify-between mb-2 md:mb-3 relative z-10">
                <h2 className="text-xs sm:text-sm font-medium text-neutral-400">Monthly Projection</h2>
                <Clock size={18} className="text-neutral-500 shrink-0" />
              </div>
              <div className="relative z-10">
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight truncate">
                  ₹{liveMonthlyBudget.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-neutral-400 mt-1.5 sm:mt-2">30 Days estimated spend</p>
              </div>
            </div>

            {/* Card 4: Total Meta Paid */}
            <div className="group bg-white/[0.03] border border-white/5 rounded-3xl p-5 sm:p-6 md:p-8 hover:bg-white/[0.06] transition-all duration-500 relative shadow-2xl flex flex-col justify-between">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-500 pointer-events-none"></div>
              <div className="flex items-center justify-between mb-2 md:mb-3 relative z-10">
                <h2 className="text-xs sm:text-sm font-medium text-neutral-400">Total Meta Paid</h2>
                <Wallet size={18} className="text-neutral-500 shrink-0" />
              </div>
              <div className="relative z-10">
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight truncate">
                  ₹{(summary?.totalPaid || 0).toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-neutral-400 mt-1.5 sm:mt-2">
                  {transactions.length} payment {transactions.length === 1 ? 'batch' : 'batches'} recorded
                </p>
              </div>
            </div>
          </div>

          {/* Middle Row: Budget Configuration Panel */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
              <div className="space-y-1.5 max-w-md">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0"></span>
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold text-white tracking-tight">Set Daily Ad Budget</h2>
                </div>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  Enter daily spend &amp; number of days to calculate budget target (Daily × Days).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                {/* Daily Budget Input */}
                <div className="relative flex-1 sm:flex-initial">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-medium text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="50"
                    value={dailyBudgetInput}
                    onChange={(e) => setDailyBudgetInput(e.target.value)}
                    placeholder="400"
                    className="w-full sm:w-32 bg-white/5 border border-white/10 rounded-xl pl-8 pr-12 py-2.5 min-h-[44px] text-base md:text-sm font-medium text-white focus:outline-none focus:border-white/20 transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 font-medium">
                    / day
                  </span>
                </div>

                <span className="text-neutral-500 font-bold text-sm hidden sm:inline">×</span>

                {/* Number of Days Input */}
                <div className="relative flex-1 sm:flex-initial">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="365"
                    step="1"
                    value={daysInput}
                    onChange={(e) => setDaysInput(e.target.value)}
                    placeholder="7"
                    className="w-full sm:w-24 bg-white/5 border border-white/10 rounded-xl pl-3 pr-10 py-2.5 min-h-[44px] text-base md:text-sm font-medium text-white focus:outline-none focus:border-white/20 transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 font-medium">
                    days
                  </span>
                </div>

                <span className="text-neutral-500 font-bold text-sm hidden sm:inline">=</span>

                {/* Calculated Result Display */}
                <div className="w-full sm:w-auto bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 min-h-[44px] flex items-center justify-center text-sm font-semibold text-white whitespace-nowrap">
                  Target: ₹{livePeriodBudget.toLocaleString('en-IN')}
                </div>

                <button
                  onClick={handleSaveBudget}
                  disabled={savingBudget}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black px-4 py-2.5 min-h-[44px] rounded-xl font-semibold hover:bg-neutral-200 active:bg-neutral-300 transition-colors text-sm disabled:opacity-50 shadow-sm"
                >
                  {savingBudget ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Save Budget</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* Bottom Row: Transactions & Payment History Table - Matches Orders table container */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl shadow-2xl relative overflow-hidden min-h-[480px] flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
            
            {/* Table Header */}
            <div className="flex-none p-4 md:px-8 md:py-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 relative z-10 bg-black/50">
              <div className="flex items-center gap-3">
                <h2 className="text-lg md:text-xl font-semibold text-white tracking-tight">Weekly Budget Payments</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-neutral-300 font-medium">
                  {transactions.length}
                </span>
              </div>

              <div className="w-full md:w-auto">
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Search payments, reference..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full md:w-64 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 min-h-[44px] text-base md:text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Table Content */}
            <div className="relative z-10 w-full overflow-x-auto no-scrollbar flex-1 flex flex-col justify-center">
              {filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center space-y-4 py-16 sm:py-20 md:py-24 px-4 text-center text-neutral-400 my-auto">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-2 shadow-inner border border-white/5">
                    <Wallet size={32} className="text-white/50 sm:hidden" />
                    <Wallet size={36} className="text-white/50 hidden sm:block" />
                  </div>
                  <div className="space-y-1.5 max-w-md">
                    <p className="text-lg sm:text-xl font-semibold text-white/90">No payment transactions recorded yet</p>
                    <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                      {searchQuery 
                        ? 'No transactions matched your search criteria.' 
                        : 'When you pay your weekly Meta budget, click "Mark Weekly Budget Paid" to record the transaction and create the corresponding business expense.'}
                    </p>
                  </div>
                  {!searchQuery && (
                    <button
                      onClick={handleOpenPaymentModal}
                      className="mt-3 inline-flex items-center justify-center gap-2 bg-white text-black px-5 py-2.5 min-h-[44px] rounded-xl font-medium hover:bg-neutral-200 transition-colors text-xs sm:text-sm shadow-sm"
                    >
                      <Plus size={16} />
                      Record First Payment
                    </button>
                  )}
                </div>
              ) : (
                <table className="w-full text-sm text-left min-w-[800px]">
                  <thead className="text-xs text-neutral-400 uppercase tracking-wider bg-white/[0.01] border-b border-white/5">
                    <tr>
                      <th className="px-4 md:px-8 py-4 md:py-5 font-semibold">Period / Week</th>
                      <th className="px-4 md:px-8 py-4 md:py-5 font-semibold">Daily Rate</th>
                      <th className="px-4 md:px-8 py-4 md:py-5 font-semibold">Weekly Target</th>
                      <th className="px-4 md:px-8 py-4 md:py-5 font-semibold">Amount Paid</th>
                      <th className="px-4 md:px-8 py-4 md:py-5 font-semibold">Payment Date</th>
                      <th className="px-4 md:px-8 py-4 md:py-5 font-semibold">Method</th>
                      <th className="px-4 md:px-8 py-4 md:py-5 font-semibold">Reference</th>
                      <th className="px-4 md:px-8 py-4 md:py-5 font-semibold">Expense Sync</th>
                      <th className="px-4 md:px-8 py-4 md:py-5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredTransactions.map((tx) => {
                      const startDate = new Date(tx.weekStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                      const endDate = new Date(tx.weekEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                      const paidDate = new Date(tx.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

                      return (
                        <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                          {/* Period */}
                          <td className="px-4 md:px-8 py-4 md:py-5 font-medium text-white whitespace-nowrap">
                            <div>{startDate} – {endDate}</div>
                            {tx.notes && (
                              <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1 max-w-xs">{tx.notes}</p>
                            )}
                          </td>

                          {/* Daily Rate */}
                          <td className="px-4 md:px-8 py-4 md:py-5 text-neutral-300 whitespace-nowrap">
                            ₹{parseFloat(tx.dailyBudget || '0').toLocaleString('en-IN')}/day
                          </td>

                          {/* Weekly Target */}
                          <td className="px-4 md:px-8 py-4 md:py-5 text-neutral-400 whitespace-nowrap">
                            ₹{parseFloat(tx.calculatedWeeklyBudget || '0').toLocaleString('en-IN')}
                          </td>

                          {/* Amount Paid */}
                          <td className="px-4 md:px-8 py-4 md:py-5 font-bold text-white whitespace-nowrap">
                            ₹{parseFloat(tx.amountPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>

                          {/* Payment Date */}
                          <td className="px-4 md:px-8 py-4 md:py-5 text-neutral-300 whitespace-nowrap">
                            {paidDate}
                          </td>

                          {/* Payment Method */}
                          <td className="px-4 md:px-8 py-4 md:py-5 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white/5 border border-white/10 text-neutral-200">
                              {tx.paymentMethodName || tx.paymentMethodCode || 'Default'}
                            </span>
                          </td>

                          {/* Reference Number */}
                          <td className="px-4 md:px-8 py-4 md:py-5 text-neutral-400 text-xs font-mono whitespace-nowrap">
                            {tx.referenceNumber ? tx.referenceNumber : '—'}
                          </td>

                          {/* Expense Link */}
                          <td className="px-4 md:px-8 py-4 md:py-5 whitespace-nowrap">
                            {tx.expenseId ? (
                              <Link
                                href={`/expenses/${tx.expenseId}`}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[32px] rounded-md text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                              >
                                <CheckCircle2 size={13} />
                                <span>Synced Expense</span>
                                <ExternalLink size={11} />
                              </Link>
                            ) : (
                              <span className="text-xs text-neutral-500">Not linked</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 md:px-8 py-4 md:py-5 text-right whitespace-nowrap">
                            <button
                              onClick={() => setTxToDelete(tx)}
                              className="inline-flex items-center justify-center p-2 min-h-[36px] min-w-[36px] text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* Record Payment / Mark Week as Paid Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div 
            className="bg-[#1e1e1e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-white">
                  Mark {currentDaysNum === 7 ? 'Weekly' : `${currentDaysNum}-Day`} Budget Paid
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400 mt-0.5 sm:mt-1">Record payment and sync to business expenses</p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-neutral-400 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitPayment} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* Preset Week/Period Selector */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-2">
                  Billing Period
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('current_week')}
                    className={`py-2 px-2 sm:px-3 min-h-[40px] text-xs font-medium rounded-lg border transition-colors ${
                      paymentPreset === 'current_week'
                        ? 'bg-white/15 border-white/30 text-white'
                        : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {currentDaysNum === 7 ? 'Current Week' : `Current (${currentDaysNum}d)`}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('previous_week')}
                    className={`py-2 px-2 sm:px-3 min-h-[40px] text-xs font-medium rounded-lg border transition-colors ${
                      paymentPreset === 'previous_week'
                        ? 'bg-white/15 border-white/30 text-white'
                        : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {currentDaysNum === 7 ? 'Previous Week' : `Prev (${currentDaysNum}d)`}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('custom')}
                    className={`py-2 px-2 sm:px-3 min-h-[40px] text-xs font-medium rounded-lg border transition-colors ${
                      paymentPreset === 'custom'
                        ? 'bg-white/15 border-white/30 text-white'
                        : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    Custom Dates
                  </button>
                </div>
              </div>

              {/* Date Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={weekStartDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 min-h-[44px] text-base md:text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={weekEndDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 min-h-[44px] text-base md:text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
              </div>

              {/* Calculation Summary Notice */}
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between text-xs">
                <span className="text-neutral-400">
                  {calculatedDays} Days × ₹{currentDailyBudgetNum.toLocaleString('en-IN')}/day
                </span>
                <span className="text-white font-medium">
                  Target: ₹{calculatedBudgetForPeriod.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Amount Paid */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs sm:text-sm font-medium text-neutral-300">
                    Amount Paid (₹)
                  </label>
                  <button
                    type="button"
                    onClick={() => setAmountPaid(calculatedBudgetForPeriod.toString())}
                    className="text-xs text-neutral-400 hover:text-white underline p-1 min-h-[30px]"
                  >
                    Use target (₹{calculatedBudgetForPeriod.toLocaleString('en-IN')})
                  </button>
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="1"
                  required
                  placeholder="Enter amount"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 min-h-[44px] text-base font-semibold text-white focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>

              {/* Payment Date & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 min-h-[44px] text-base md:text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Payment Method
                  </label>
                  <select
                    required
                    value={paymentMethodId}
                    onChange={(e) => setPaymentMethodId(e.target.value)}
                    className="w-full bg-[#2a2a2a] border border-white/10 rounded-xl px-3 py-2.5 min-h-[44px] text-base md:text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                  >
                    {paymentMethods.map((pm) => (
                      <option key={pm.id} value={pm.id}>
                        {pm.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Reference / Transaction ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI-98421049281, Meta Inv #10294"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 min-h-[44px] text-base md:text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20 font-mono transition-colors"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Optional notes or campaign details"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 min-h-[44px] text-base md:text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>

              {/* Sync to Expenses Toggle */}
              <div className="pt-2">
                <label className="flex items-start gap-3 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncToExpenses}
                    onChange={(e) => setSyncToExpenses(e.target.checked)}
                    className="mt-0.5 rounded text-white focus:ring-white/20 h-4 w-4"
                  />
                  <div className="text-xs">
                    <p className="font-medium text-white">
                      Automatically add to Business Expenses
                    </p>
                    <p className="text-neutral-400 mt-0.5">
                      Filing under category <strong>&quot;Meta Ads.&quot;</strong> so business expense totals remain synchronized.
                    </p>
                  </div>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-white/5 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black px-5 py-2.5 min-h-[44px] rounded-xl font-medium hover:bg-neutral-200 transition-colors text-sm disabled:opacity-50 shadow-sm"
                >
                  {isSubmittingPayment ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <span>Confirm &amp; Record Payment</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      <ConfirmModal
        isOpen={!!txToDelete}
        title="Delete Meta Ads Payment Record?"
        message={`Are you sure you want to delete the payment record of ₹${parseFloat(txToDelete?.amountPaid || '0').toLocaleString('en-IN')}? If this payment was synchronized to Business Expenses, the corresponding expense record will also be removed.`}
        confirmText="Delete Record"
        cancelText="Cancel"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setTxToDelete(null)}
      />
    </div>
  );
}
