'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Plus, 
  CheckCircle2, 
  ExternalLink, 
  Trash2, 
  Search, 
  Check, 
  Clock,
  Wallet,
  Loader2,
  Scale
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/context/AuthContext';
import AccessDenied from '@/components/AccessDenied';
import MetaAdsCalendar, { DailyPlanItem } from '@/components/meta-ads/MetaAdsCalendar';
import DailyCampaignPlanner, { CampaignEntry } from '@/components/meta-ads/DailyCampaignPlanner';

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
  const canManagePlanner = hasPermission('meta_ads:manage_planner') || canEditAds;

  // Tabs: 'planner' | 'billing'
  const [activeTab, setActiveTab] = useState<'planner' | 'billing'>('planner');

  const [loading, setLoading] = useState(true);
  const [savingBudget, setSavingBudget] = useState(false);
  const [settings, setSettings] = useState<MetaAdsSettings | null>(null);
  const [transactions, setTransactions] = useState<MetaAdsTransaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);

  // Daily Planner State
  const todayStr = useMemo(() => formatLocalDate(new Date()), []);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [plansMap, setPlansMap] = useState<Record<string, DailyPlanItem>>({});

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

  // Fetch Planner Plans for month
  const fetchPlannerData = useCallback(async (monthDate: Date) => {
    try {
      const year = monthDate.getFullYear();
      const month = String(monthDate.getMonth() + 1).padStart(2, '0');
      const monthQuery = `${year}-${month}`;

      const res = await fetch(`/api/meta-ads/planner?month=${monthQuery}`);
      if (!res.ok) throw new Error('Failed to fetch planner plans');
      const data = await res.json();

      if (data.plans) {
        const map: Record<string, DailyPlanItem> = {};
        data.plans.forEach((p: DailyPlanItem) => {
          map[p.date] = p;
        });
        setPlansMap(map);
      }
    } catch (err) {
      console.error('Failed to load planner data:', err);
    }
  }, []);

  // Fetch general meta ads data
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPlannerData(currentMonth);
  }, [currentMonth, fetchPlannerData]);

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

  // Handle Save Daily Planner
  const handleSaveDailyPlan = async (planData: {
    date: string;
    totalBudget: number;
    campaignCount: number;
    distributionMode: 'ALL_SAME' | 'DIFFERENT';
    campaigns: CampaignEntry[];
    status: 'IN_PROGRESS' | 'DONE' | 'NOT_DONE';
    notes: string;
  }): Promise<boolean> => {
    try {
      const res = await fetch('/api/meta-ads/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save plan');
      }

      const resData = await res.json();
      if (resData.plan) {
        setPlansMap((prev) => ({
          ...prev,
          [resData.plan.date]: resData.plan,
        }));
      }

      return true;
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
      else toast.error('Failed to save daily plan');
      return false;
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

  // Monthly Budget Balance Calculation
  const thisMonthSpent = summary?.thisMonthPaid || 0;
  const monthlyBalanceRemaining = Math.max(0, liveMonthlyBudget - thisMonthSpent);

  if (!canViewAds) {
    return <AccessDenied message="You do not have permission to view Meta Ads performance and budgets." />;
  }

  return (
    <div className="space-y-6 sm:space-y-8 relative z-10 pb-8 sm:pb-12">
      {/* Header */}
      <header className="flex-none flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">Meta Ads</h1>
          <p className="text-neutral-400 text-xs sm:text-sm md:text-base">
            Daily campaign planning, budget allocation, and billing ledger
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

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 p-1 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('planner')}
          className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'planner'
              ? 'bg-neutral-800 text-white font-semibold'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <CalendarIcon size={15} />
          <span>Daily Planner</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('billing')}
          className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'billing'
              ? 'bg-neutral-800 text-white font-semibold'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Wallet size={15} />
          <span>Billing &amp; Payments ({transactions.length})</span>
        </button>
      </div>

      {loading && !settings ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Top Row: 4 Uniform KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Daily Budget */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Daily Budget</h2>
                <CalendarIcon size={16} className="text-neutral-500 shrink-0" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-semibold font-mono text-white tracking-tight truncate">
                  ₹{currentDailyBudgetNum.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-neutral-500 mt-1">Active daily target</p>
              </div>
            </div>

            {/* Card 2: Period Budget Target */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Period Budget ({currentDaysNum}d)
                </h2>
                <TrendingUp size={16} className="text-neutral-500 shrink-0" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-semibold font-mono text-white tracking-tight truncate">
                  ₹{livePeriodBudget.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  {currentDaysNum}d × ₹{currentDailyBudgetNum.toLocaleString('en-IN')}/day
                </p>
              </div>
            </div>

            {/* Card 3: Monthly Budget */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Monthly Budget</h2>
                <Clock size={16} className="text-neutral-500 shrink-0" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-semibold font-mono text-white tracking-tight truncate">
                  ₹{liveMonthlyBudget.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-neutral-500 mt-1">30 Days estimated spend</p>
              </div>
            </div>

            {/* Card 4: Monthly Balance */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Monthly Balance</h2>
                <Scale size={16} className="text-neutral-500 shrink-0" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-semibold font-mono text-white tracking-tight truncate">
                  ₹{monthlyBalanceRemaining.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  ₹{thisMonthSpent.toLocaleString('en-IN')} spent this month
                </p>
              </div>
            </div>
          </div>

          {/* TAB 1: Daily Planner View */}
          {activeTab === 'planner' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Side: Daily Campaign Planner */}
              <div className="lg:col-span-6 xl:col-span-6 bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 sm:p-6 flex flex-col justify-between">
                <DailyCampaignPlanner
                  key={selectedDate}
                  selectedDate={selectedDate}
                  onDateChange={(d) => setSelectedDate(d)}
                  currentPlan={plansMap[selectedDate] || null}
                  defaultDailyBudget={currentDailyBudgetNum}
                  onSavePlan={handleSaveDailyPlan}
                  canEdit={canManagePlanner}
                  todayStr={todayStr}
                />
              </div>

              {/* Right Side: Interactive Calendar */}
              <div className="lg:col-span-6 xl:col-span-6 bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 sm:p-6 flex flex-col justify-between">
                <MetaAdsCalendar
                  currentMonth={currentMonth}
                  onMonthChange={(m) => setCurrentMonth(m)}
                  selectedDate={selectedDate}
                  onSelectDate={(d) => setSelectedDate(d)}
                  plansMap={plansMap}
                  todayStr={todayStr}
                />
              </div>
            </div>
          )}


          {/* TAB 2: Billing & Payments View (Budget Config & Weekly Ledger) */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              {/* Budget Configuration Panel */}
              <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">Base Target Settings</h2>
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                      Enter baseline daily spend &amp; number of days to set the period budget target.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                    {/* Daily Budget Input */}
                    <div className="relative flex-1 sm:flex-initial">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-medium text-sm">
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
                        className="w-full sm:w-32 bg-neutral-900 border border-neutral-800 rounded-lg pl-7 pr-12 py-2 min-h-[40px] text-sm font-medium text-white focus:outline-none focus:border-neutral-600 transition-colors"
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
                        className="w-full sm:w-24 bg-neutral-900 border border-neutral-800 rounded-lg pl-3 pr-10 py-2 min-h-[40px] text-sm font-medium text-white focus:outline-none focus:border-neutral-600 transition-colors"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 font-medium">
                        days
                      </span>
                    </div>

                    <span className="text-neutral-500 font-bold text-sm hidden sm:inline">=</span>

                    {/* Calculated Result Display */}
                    <div className="w-full sm:w-auto bg-neutral-900 border border-neutral-800 rounded-lg px-3.5 py-2 min-h-[40px] flex items-center justify-center text-sm font-semibold text-white whitespace-nowrap">
                      Target: ₹{livePeriodBudget.toLocaleString('en-IN')}
                    </div>

                    {canEditAds && (
                      <button
                        onClick={handleSaveBudget}
                        disabled={savingBudget}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black px-4 py-2 min-h-[40px] rounded-lg font-semibold hover:bg-neutral-200 active:bg-neutral-300 transition-colors text-sm disabled:opacity-50"
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
                    )}
                  </div>
                </div>
              </div>

              {/* Transactions & Payment History Table */}
              <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden flex flex-col">
                {/* Table Header */}
                <div className="p-4 md:px-6 md:py-4 border-b border-neutral-800 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-neutral-900/80">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base md:text-lg font-semibold text-white tracking-tight">Weekly Budget Payments</h2>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 font-medium">
                      {transactions.length}
                    </span>
                  </div>

                  {/* Search and Action Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1 sm:w-64">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="Search ref, notes, method..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
                      />
                    </div>

                    {canEditAds && (
                      <button
                        onClick={handleOpenPaymentModal}
                        className="inline-flex items-center justify-center gap-2 bg-white text-black px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-neutral-200 transition-colors"
                      >
                        <Plus size={15} />
                        <span>Record Payment</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Table Body */}
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-800 text-[11px] text-neutral-400 font-semibold uppercase tracking-wider bg-neutral-900">
                        <th className="py-3 px-4 md:px-6">Period</th>
                        <th className="py-3 px-4 md:px-6">Target Spend</th>
                        <th className="py-3 px-4 md:px-6">Amount Paid</th>
                        <th className="py-3 px-4 md:px-6">Payment Date</th>
                        <th className="py-3 px-4 md:px-6">Method &amp; Ref</th>
                        <th className="py-3 px-4 md:px-6">Linked Expense</th>
                        {canEditAds && <th className="py-3 px-4 md:px-6 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60 text-sm">
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={canEditAds ? 7 : 6} className="py-12 text-center text-neutral-500 text-sm">
                            {searchQuery ? 'No payment records match your search.' : 'No weekly ad payments recorded yet.'}
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map((tx) => {
                          const daysInPeriod = calculateDays(tx.weekStartDate, tx.weekEndDate);
                          return (
                            <tr key={tx.id} className="hover:bg-neutral-800/30 transition-colors group">
                              {/* Period Range */}
                              <td className="py-3.5 px-4 md:px-6">
                                <div className="font-semibold text-white">
                                  {tx.weekStartDate} to {tx.weekEndDate}
                                </div>
                                <div className="text-xs text-neutral-400">
                                  {daysInPeriod} {daysInPeriod === 1 ? 'day' : 'days'}
                                </div>
                              </td>

                              {/* Target Spend */}
                              <td className="py-3.5 px-4 md:px-6">
                                <div className="text-neutral-300 font-medium">
                                  ₹{parseFloat(tx.calculatedWeeklyBudget).toLocaleString('en-IN')}
                                </div>
                                <div className="text-xs text-neutral-500">
                                  ₹{parseFloat(tx.dailyBudget).toLocaleString('en-IN')}/day
                                </div>
                              </td>

                              {/* Amount Paid */}
                              <td className="py-3.5 px-4 md:px-6">
                                <div className="font-semibold text-emerald-400">
                                  ₹{parseFloat(tx.amountPaid).toLocaleString('en-IN')}
                                </div>
                                <div className="text-[11px] text-neutral-500 flex items-center gap-1">
                                  <CheckCircle2 size={12} className="text-emerald-400" />
                                  <span>{tx.status}</span>
                                </div>
                              </td>

                              {/* Payment Date */}
                              <td className="py-3.5 px-4 md:px-6 text-neutral-300">
                                {tx.paymentDate}
                              </td>

                              {/* Method & Ref */}
                              <td className="py-3.5 px-4 md:px-6">
                                <div className="text-white font-medium">
                                  {tx.paymentMethodName || tx.paymentMethodCode || 'Other'}
                                </div>
                                {tx.referenceNumber && (
                                  <div className="text-xs text-neutral-400 font-mono">
                                    {tx.referenceNumber}
                                  </div>
                                )}
                              </td>

                              {/* Linked Expense */}
                              <td className="py-3.5 px-4 md:px-6">
                                {tx.expenseId ? (
                                  <Link
                                    href="/expenses"
                                    className="inline-flex items-center gap-1 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 px-2 py-1 rounded-md border border-neutral-700 transition-colors"
                                  >
                                    <span>View Expense</span>
                                    <ExternalLink size={12} />
                                  </Link>
                                ) : (
                                  <span className="text-xs text-neutral-500">Unlinked</span>
                                )}
                              </td>

                              {/* Actions */}
                              {canEditAds && (
                                <td className="py-3.5 px-4 md:px-6 text-right">
                                  <button
                                    onClick={() => setTxToDelete(tx)}
                                    className="p-1 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                                    title="Delete Transaction"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Payment Recording Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-lg w-full shadow-xl relative">
            <h3 className="text-lg font-bold text-white mb-1">Record Meta Ads Budget Payment</h3>
            <p className="text-xs text-neutral-400 mb-5">
              Confirm payment details for your selected ad period.
            </p>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              {/* Presets */}
              <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                <button
                  type="button"
                  onClick={() => handleSelectPreset('current_week')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    paymentPreset === 'current_week' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Current Period
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('previous_week')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    paymentPreset === 'previous_week' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Previous Period
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentPreset('custom')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    paymentPreset === 'custom' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Custom
                </button>
              </div>

              {/* Date Range Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-400">Start Date</label>
                  <input
                    type="date"
                    required
                    value={weekStartDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-neutral-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-400">End Date</label>
                  <input
                    type="date"
                    required
                    value={weekEndDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-neutral-600"
                  />
                </div>
              </div>

              {/* Amount and Payment Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-400">Amount Paid (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="e.g. 2800"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-neutral-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-400">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-neutral-600"
                  />
                </div>
              </div>

              {/* Payment Method & Reference */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-400">Payment Method</label>
                  <select
                    required
                    value={paymentMethodId}
                    onChange={(e) => setPaymentMethodId(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-neutral-600"
                  >
                    {paymentMethods.map((pm) => (
                      <option key={pm.id} value={pm.id} className="bg-neutral-900 text-white">
                        {pm.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-400">Reference / UTR (Optional)</label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g. UPI Ref #12345"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-neutral-600"
                  />
                </div>
              </div>

              {/* Sync to Expenses Toggle */}
              <div className="flex items-center gap-3 p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                <input
                  type="checkbox"
                  id="syncExpenses"
                  checked={syncToExpenses}
                  onChange={(e) => setSyncToExpenses(e.target.checked)}
                  className="rounded border-neutral-700 text-white focus:ring-0"
                />
                <label htmlFor="syncExpenses" className="text-xs text-neutral-300 select-none cursor-pointer">
                  Automatically sync this payment to <strong>Expenses</strong> ledger
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-4 py-2 bg-white text-black font-semibold text-xs rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmittingPayment ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <span>Record Payment</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {txToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Delete Payment Record"
          message={`Are you sure you want to delete the payment record for period ${txToDelete.weekStartDate} to ${txToDelete.weekEndDate}? This will also delete any linked expense record.`}
          confirmText="Delete"
          onConfirm={handleConfirmDelete}
          onCancel={() => setTxToDelete(null)}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
