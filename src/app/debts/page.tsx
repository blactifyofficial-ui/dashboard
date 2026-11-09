'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import AccessDenied from '@/components/AccessDenied';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmModal from '@/components/ConfirmModal';
import DebtsSummaryCards from '@/components/debts/DebtsSummaryCards';
import DebtsFilterToolbar from '@/components/debts/DebtsFilterToolbar';
import DebtsTable from '@/components/debts/DebtsTable';
import AddDebtModal from '@/components/debts/AddDebtModal';
import RecordSettlementModal from '@/components/debts/RecordSettlementModal';
import DebtLedgerModal from '@/components/debts/DebtLedgerModal';
import ManageContactsModal from '@/components/debts/ManageContactsModal';
import { Debt, DebtContact, DebtsSummary, DebtType, PaymentMethod } from '@/components/debts/types';
import { Button } from '@/components/ui/button';
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DebtsPage() {
  const { hasPermission } = useAuth();

  const canView = hasPermission('debts:view');
  const canManage = hasPermission('debts:manage');
  const canDelete = hasPermission('debts:delete');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [contacts, setContacts] = useState<DebtContact[]>([]);
  const [summary, setSummary] = useState<DebtsSummary | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Filters state
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'LENT' | 'BORROWED'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalDefaultType, setAddModalDefaultType] = useState<DebtType>('LENT');
  const [initialModalContact, setInitialModalContact] = useState<DebtContact | null>(null);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [settlementDebt, setSettlementDebt] = useState<Debt | null>(null);

  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [ledgerDebt, setLedgerDebt] = useState<Debt | null>(null);

  const [deletingDebt, setDeletingDebt] = useState<Debt | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch payment methods once
  useEffect(() => {
    fetch('/api/payment-methods')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setPaymentMethods(data))
      .catch((err) => console.error('Failed to load payment methods:', err));
  }, []);

  // Fetch Contacts
  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch('/api/debts/contacts');
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
      }
    } catch (err: unknown) {
      console.error('Failed to load contacts:', err);
    }
  }, []);

  // Fetch Debts & Summary
  const fetchDebts = useCallback(
    async (isBackground = false) => {
      if (isBackground) setRefreshing(true);

      try {
        const params = new URLSearchParams();
        if (typeFilter !== 'ALL') params.set('type', typeFilter);
        if (statusFilter !== 'ALL') params.set('status', statusFilter);
        if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
        if (searchQuery.trim()) params.set('search', searchQuery.trim());

        const res = await fetch(`/api/debts?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Failed to load debt records');

        setDebts(data.debts || []);
        setSummary(data.summary || null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error loading debts';
        toast.error(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [typeFilter, statusFilter, categoryFilter, searchQuery]
  );

  useEffect(() => {
    if (!canView) return;
    let isMounted = true;
    const run = async () => {
      await Promise.all([fetchDebts(), fetchContacts()]);
    };
    if (isMounted) {
      void run();
    }
    return () => {
      isMounted = false;
    };
  }, [canView, fetchDebts, fetchContacts]);

  // Filter Tab Counts
  const filterCounts = useMemo(() => {
    let lent = 0;
    let borrowed = 0;
    let settled = 0;
    for (const d of debts) {
      if (d.type === 'LENT') lent++;
      if (d.type === 'BORROWED') borrowed++;
      if (d.status === 'SETTLED' || Number(d.remainingAmount) <= 0.001) settled++;
    }
    return {
      all: debts.length,
      lent,
      borrowed,
      settled,
    };
  }, [debts]);

  // Handlers
  const handleOpenAdd = (type: DebtType, contact?: DebtContact) => {
    setEditingDebt(null);
    setInitialModalContact(contact || null);
    setAddModalDefaultType(type);
    setIsAddModalOpen(true);
  };

  const handleEdit = (debt: Debt) => {
    setEditingDebt(debt);
    setInitialModalContact(null);
    setIsAddModalOpen(true);
  };

  const handleRecordSettlement = (debt: Debt) => {
    setSettlementDebt(debt);
    setIsSettlementModalOpen(true);
  };

  const handleViewLedger = (debt: Debt) => {
    setLedgerDebt(debt);
    setIsLedgerModalOpen(true);
  };

  const handleDelete = (debt: Debt) => {
    setDeletingDebt(debt);
  };

  const confirmDelete = async () => {
    if (!deletingDebt) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/debts/${deletingDebt.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete debt');

      toast.success('Debt record deleted successfully');
      setDeletingDebt(null);
      fetchDebts(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!canView) {
    return <AccessDenied message="You do not have permission to view Borrow & Lend records." />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Quick Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-[32px] font-bold tracking-tight text-foreground">
              Borrow &amp; Lend
            </h1>
            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted/60 text-foreground border border-border">
              Debt &amp; Credit Ledger
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Track money lent out to partners or vendors, borrowings, and installment settlement history.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-nowrap overflow-x-auto pb-1 sm:pb-0">
          {/* Person Directory Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsContactsModalOpen(true)}
            className="h-9 px-3.5 rounded-full border-border bg-card text-foreground hover:bg-muted shrink-0 whitespace-nowrap"
            title="Manage Person / Party Directory"
          >
            <Users className="w-3.5 h-3.5 mr-1.5 text-primary" />
            <span>Person Directory</span>
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground font-mono font-bold">
              {contacts.length}
            </span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              fetchDebts(true);
              fetchContacts();
            }}
            disabled={refreshing}
            className="h-9 px-3.5 rounded-full border-border bg-card text-foreground hover:bg-muted shrink-0 whitespace-nowrap"
            title="Refresh records"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {canManage && (
            <>
              {/* + Lend Money Button (Emerald) */}
              <Button
                size="sm"
                onClick={() => handleOpenAdd('LENT')}
                className="h-9 px-4 text-xs font-semibold rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm border border-emerald-500/20 shrink-0 whitespace-nowrap"
              >
                <ArrowUpRight className="w-4 h-4 mr-1.5 text-white" />
                Lend Money
              </Button>

              {/* + Borrow Money Button (Amber) */}
              <Button
                size="sm"
                onClick={() => handleOpenAdd('BORROWED')}
                className="h-9 px-4 text-xs font-semibold rounded-full bg-amber-600 hover:bg-amber-500 text-white shadow-sm border border-amber-500/20 shrink-0 whitespace-nowrap"
              >
                <ArrowDownLeft className="w-4 h-4 mr-1.5 text-white" />
                Borrow Money
              </Button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <DebtsSummaryCards summary={summary} />

      {/* Filter Toolbar */}
      <DebtsFilterToolbar
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        counts={filterCounts}
      />

      {/* Main Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center bg-card border border-border rounded-[18px]">
          <LoadingSpinner />
          <p className="text-xs text-muted-foreground mt-2">Loading debt ledger...</p>
        </div>
      ) : (
        <DebtsTable
          debts={debts}
          canManage={canManage}
          canDelete={canDelete}
          onRecordSettlement={handleRecordSettlement}
          onViewLedger={handleViewLedger}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Modals */}
      <AddDebtModal
        open={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setInitialModalContact(null);
        }}
        onSuccess={() => {
          fetchDebts(true);
          fetchContacts();
        }}
        editingDebt={editingDebt}
        defaultType={addModalDefaultType}
        paymentMethods={paymentMethods}
        contacts={contacts}
        initialContact={initialModalContact}
        onRefreshContacts={fetchContacts}
        onOpenManageContacts={() => setIsContactsModalOpen(true)}
      />

      <ManageContactsModal
        open={isContactsModalOpen}
        onClose={() => setIsContactsModalOpen(false)}
        contacts={contacts}
        onRefreshContacts={fetchContacts}
        canManage={canManage}
        onSelectContactForDebt={(contact, type) => handleOpenAdd(type, contact)}
      />

      <RecordSettlementModal
        open={isSettlementModalOpen}
        onClose={() => setIsSettlementModalOpen(false)}
        onSuccess={() => fetchDebts(true)}
        debt={settlementDebt}
        paymentMethods={paymentMethods}
      />

      <DebtLedgerModal
        open={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
        debt={ledgerDebt}
        canManage={canManage}
        onSettlementChanged={() => fetchDebts(true)}
      />

      <ConfirmModal
        isOpen={!!deletingDebt}
        title="Delete Debt Record"
        message={`Are you sure you want to permanently delete the debt record for "${deletingDebt?.contactName}"? This will also remove all logged settlement installments for this record.`}
        confirmText="Delete Record"
        cancelText="Cancel"
        isLoading={isDeleting}
        variant="destructive"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingDebt(null)}
      />
    </div>
  );
}
