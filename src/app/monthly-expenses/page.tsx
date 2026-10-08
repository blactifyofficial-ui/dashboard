'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Layers, 
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

import { 
  MonthlyExpenseEntry, 
  MonthlyExpenseTemplate, 
  MonthMeta, 
  PaymentMethod, 
  MonthlyStats
} from '@/components/monthly-expenses/types';

import MonthSelector from '@/components/monthly-expenses/MonthSelector';
import MonthlySummaryCards from '@/components/monthly-expenses/MonthlySummaryCards';
import MonthlyExpenseList from '@/components/monthly-expenses/MonthlyExpenseList';
import EntryPaymentModal from '@/components/monthly-expenses/EntryPaymentModal';
import AddEntryModal from '@/components/monthly-expenses/AddEntryModal';
import EditEntryModal from '@/components/monthly-expenses/EditEntryModal';
import TemplateManagerModal from '@/components/monthly-expenses/TemplateManagerModal';
import UnlockMonthModal from '@/components/monthly-expenses/UnlockMonthModal';
import { useAuth } from '@/context/AuthContext';
import AccessDenied from '@/components/AccessDenied';

export default function MonthlyExpensesPage() {
  const { hasPermission } = useAuth();
  const canViewBills = hasPermission('monthly_expenses:view');
  const canEditBills = hasPermission('monthly_expenses:edit');

  const [loading, setLoading] = useState(true);
  const [activeMonth, setActiveMonth] = useState<string>('');
  const [months, setMonths] = useState<MonthMeta[]>([]);
  const [entries, setEntries] = useState<MonthlyExpenseEntry[]>([]);
  const [templates, setTemplates] = useState<MonthlyExpenseTemplate[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [stats, setStats] = useState<MonthlyStats>({
    totalItems: 0,
    paidCount: 0,
    pendingCount: 0,
    totalExpected: 0,
    totalPaid: 0,
    totalPending: 0,
    progressPercentage: 0,
  });

  // Modal States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedEntryForPayment, setSelectedEntryForPayment] = useState<MonthlyExpenseEntry | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEntryForEdit, setSelectedEntryForEdit] = useState<MonthlyExpenseEntry | null>(null);

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [selectedMonthForUnlock, setSelectedMonthForUnlock] = useState<MonthMeta | null>(null);

  // Fetch Month Data
  const fetchData = useCallback(async (monthToFetch?: string) => {
    try {
      setLoading(true);
      const url = monthToFetch
        ? `/api/monthly-expenses?month=${monthToFetch}`
        : '/api/monthly-expenses';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch monthly expenses');
      const data = await res.json();

      setActiveMonth(data.activeMonth);
      setMonths(data.months || []);
      setEntries(data.entries || []);
      setTemplates(data.templates || []);
      setPaymentMethods(data.paymentMethods || []);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load monthly expenses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function loadInitial() {
      try {
        const res = await fetch('/api/monthly-expenses');
        if (!res.ok) throw new Error('Failed to fetch monthly expenses');
        const data = await res.json();
        if (!ignore) {
          setActiveMonth(data.activeMonth);
          setMonths(data.months || []);
          setEntries(data.entries || []);
          setTemplates(data.templates || []);
          setPaymentMethods(data.paymentMethods || []);
          if (data.stats) setStats(data.stats);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load monthly expenses');
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    loadInitial();
    return () => {
      ignore = true;
    };
  }, []);

  // Select month handler
  const handleSelectMonth = (monthKey: string) => {
    fetchData(monthKey);
  };

  // Mark as Paid submission handler
  const handlePaymentSubmit = async (paymentData: {
    id: string;
    status: 'PAID' | 'PENDING';
    actualAmount: string;
    paidDate: string;
    paymentMethodId: string;
    referenceNumber: string;
    notes: string;
  }) => {
    try {
      const res = await fetch(`/api/monthly-expenses/entries/${paymentData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      if (!res.ok) throw new Error('Failed to update payment');
      toast.success('Payment recorded');
      fetchData(activeMonth);
    } catch {
      toast.error('Failed to update bill');
    }
  };

  // Toggle Unpaid handler
  const handleToggleUnpaid = async (entry: MonthlyExpenseEntry) => {
    try {
      const res = await fetch(`/api/monthly-expenses/entries/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PENDING',
          actualAmount: '0',
          paidDate: null,
        }),
      });
      if (!res.ok) throw new Error('Failed to mark as unpaid');
      toast.success(`Marked as pending`);
      fetchData(activeMonth);
    } catch {
      toast.error('Failed to update status');
    }
  };

  // Add bill handler
  const handleAddEntry = async (data: {
    month: string;
    name: string;
    category: string;
    expectedAmount: string;
    dueDay: string;
    notes: string;
    paymentMethodId: string;
    saveToTemplate: boolean;
  }) => {
    try {
      const res = await fetch('/api/monthly-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to add bill');

      if (data.saveToTemplate) {
        await fetch('/api/monthly-expenses/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name,
            category: data.category,
            defaultAmount: data.expectedAmount,
            dueDay: data.dueDay,
            paymentMethodId: data.paymentMethodId,
            notes: data.notes,
          }),
        });
        toast.success('Bill added and saved to template');
      } else {
        toast.success('Bill added');
      }

      fetchData(activeMonth);
    } catch {
      toast.error('Failed to add bill');
    }
  };

  // Edit bill handler
  const handleUpdateEntry = async (data: {
    id: string;
    name: string;
    category: string;
    expectedAmount: string;
    actualAmount: string;
    dueDay: string;
    paymentMethodId: string;
    notes: string;
  }) => {
    try {
      const res = await fetch(`/api/monthly-expenses/entries/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update bill');
      toast.success('Bill updated');
      fetchData(activeMonth);
    } catch {
      toast.error('Failed to update bill');
    }
  };

  // Delete bill handler
  const handleDeleteEntry = async (id: string) => {
    try {
      const res = await fetch(`/api/monthly-expenses/entries/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete bill');
      toast.success('Bill deleted');
      fetchData(activeMonth);
    } catch {
      toast.error('Failed to delete bill');
    }
  };

  // Sync template to active month
  const handleSyncToActiveMonth = async () => {
    try {
      const res = await fetch('/api/monthly-expenses/sync-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: activeMonth }),
      });
      if (!res.ok) throw new Error('Failed to sync templates');
      const result = await res.json();
      toast.success(`Synced ${result.addedCount} bills from template`);
      fetchData(activeMonth);
    } catch {
      toast.error('Failed to sync templates');
    }
  };

  // Manual unlock handler
  const handleUnlockManually = async (monthKey: string) => {
    try {
      const res = await fetch('/api/monthly-expenses/month-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: monthKey,
          isUnlockedManual: 'true',
        }),
      });
      if (!res.ok) throw new Error('Failed to unlock month');
      toast.success('Month unlocked');
      fetchData(monthKey);
    } catch {
      toast.error('Failed to unlock month');
    }
  };

  const activeMonthLabel =
    months.find((m) => m.month === activeMonth)?.label || activeMonth;

  if (loading && !activeMonth) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!canViewBills) {
    return <AccessDenied message="You do not have permission to view monthly bills and overheads." />;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4 p-4 sm:p-6 md:p-8">
      {/* Top Header */}
      <div className="flex-none flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Monthly Expenses</h1>
          <p className="text-xs sm:text-sm text-white/60">Manage recurring bills, salaries, rent, and overheads</p>
        </div>

        {canEditBills && (
          <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white/80 hover:text-white px-4 h-11 min-h-[44px] rounded-lg font-medium hover:bg-white/10 transition-colors text-sm"
            >
              <Layers size={16} />
              Templates
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-black px-4 h-11 min-h-[44px] rounded-lg font-medium hover:bg-white/90 transition-colors text-sm shadow-sm"
            >
              <Plus size={16} />
              Add Bill
            </button>
          </div>
        )}
      </div>

      {/* Month Timeline / Selector */}
      <MonthSelector
        months={months}
        activeMonth={activeMonth}
        onSelectMonth={handleSelectMonth}
        onUnlockMonthPrompt={(m) => {
          setSelectedMonthForUnlock(m);
          setIsUnlockModalOpen(true);
        }}
      />

      {/* Monthly Summary Statistics Cards */}
      <MonthlySummaryCards stats={stats} monthLabel={activeMonthLabel} />

      {/* Main Checklist / Expense Table */}
      <MonthlyExpenseList
        entries={entries}
        monthLabel={activeMonthLabel}
        onMarkPaidClick={(entry) => {
          setSelectedEntryForPayment(entry);
          setIsPaymentModalOpen(true);
        }}
        onToggleUnpaid={handleToggleUnpaid}
        onEditClick={(entry) => {
          setSelectedEntryForEdit(entry);
          setIsEditModalOpen(true);
        }}
        onAddClick={() => setIsAddModalOpen(true)}
        onOpenTemplates={() => setIsTemplateModalOpen(true)}
        onDeleteEntry={handleDeleteEntry}
      />

      {/* Modals */}
      <EntryPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedEntryForPayment(null);
        }}
        entry={selectedEntryForPayment}
        paymentMethods={paymentMethods}
        onSubmit={handlePaymentSubmit}
      />

      <AddEntryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        month={activeMonth}
        monthLabel={activeMonthLabel}
        paymentMethods={paymentMethods}
        onAdd={handleAddEntry}
      />

      <EditEntryModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEntryForEdit(null);
        }}
        entry={selectedEntryForEdit}
        paymentMethods={paymentMethods}
        onUpdate={handleUpdateEntry}
        onDelete={handleDeleteEntry}
      />

      <TemplateManagerModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        templates={templates}
        paymentMethods={paymentMethods}
        activeMonth={activeMonth}
        onUpdateTemplates={() => fetchData(activeMonth)}
        onSyncToActiveMonth={handleSyncToActiveMonth}
      />

      <UnlockMonthModal
        isOpen={isUnlockModalOpen}
        onClose={() => {
          setIsUnlockModalOpen(false);
          setSelectedMonthForUnlock(null);
        }}
        month={selectedMonthForUnlock}
        onUnlockManually={handleUnlockManually}
      />
    </div>
  );
}
