'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  X,
  Users,
  Receipt,
  PieChart,
  Banknote
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmModal from '@/components/ConfirmModal';

import { Partner, PartnerTransaction, PaymentMethod, SummaryData, TransactionType } from '@/components/partners/types';
import { formatInputDate, formatCurrency } from '@/components/partners/utils';
import PartnerSummaryCards from '@/components/partners/PartnerSummaryCards';
import PartnersOverviewTab from '@/components/partners/PartnersOverviewTab';
import MasterLedgerTab from '@/components/partners/MasterLedgerTab';
import CapTableTab from '@/components/partners/CapTableTab';
import PartnerModal, { PartnerFormData } from '@/components/partners/PartnerModal';
import TransactionModal, { TransactionFormData } from '@/components/partners/TransactionModal';
import PartnerLedgerModal from '@/components/partners/PartnerLedgerModal';
import { useAuth } from '@/context/AuthContext';
import AccessDenied from '@/components/AccessDenied';

export default function PartnersPage() {
  const { hasPermission } = useAuth();
  const canViewPartners = hasPermission('partners:view_self');
  const canManagePartners = hasPermission('partners:manage_partners');
  const canRecordTransaction = hasPermission('partners:record_transaction');

  const [loading, setLoading] = useState(true);

  const [partners, setPartners] = useState<Partner[]>([]);
  const [transactions, setTransactions] = useState<PartnerTransaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'captable'>('overview');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [partnerFilter, setPartnerFilter] = useState<string>('ALL');

  // Partner Modal
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [partnerFormData, setPartnerFormData] = useState<PartnerFormData>({
    name: '',
    email: '',
    phone: '',
    equityPercentage: '',
    status: 'ACTIVE',
    joinedDate: formatInputDate(new Date()),
    notes: '',
  });
  const [isSubmittingPartner, setIsSubmittingPartner] = useState(false);

  // Transaction Modal
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [editingTxn, setEditingTxn] = useState<PartnerTransaction | null>(null);
  const [txnFormData, setTxnFormData] = useState<TransactionFormData>({
    partnerId: '',
    type: 'INVESTMENT',
    amount: '',
    transactionDate: formatInputDate(new Date()),
    paymentMethodId: '',
    status: 'COMPLETED',
    referenceNumber: '',
    notes: '',
  });
  const [isSubmittingTxn, setIsSubmittingTxn] = useState(false);

  // Partner Ledger Drawer / Modal
  const [selectedPartnerForLedger, setSelectedPartnerForLedger] = useState<Partner | null>(null);

  // Confirm Delete Modal
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'partner' | 'transaction';
    id: string;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'partner',
    id: '',
    title: '',
    message: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch all partner data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/partners');
      if (!res.ok) throw new Error('Failed to fetch partners data');
      const data = await res.json();
      const partnersList = data.partners || [];
      const enrichedTxns = (data.transactions || []).map((t: PartnerTransaction) => {
        const partner = partnersList.find((p: Partner) => p.id === t.partnerId);
        return {
          ...t,
          partnerName: t.partnerName || partner?.name || '—',
          partnerEmail: t.partnerEmail || partner?.email || null,
        };
      });
      setPartners(partnersList);
      setTransactions(enrichedTxns);
      setPaymentMethods(data.paymentMethods || []);
      setSummary(data.summary || null);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load partner information');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  // Open Add Partner Modal
  const handleOpenAddPartner = () => {
    setEditingPartner(null);
    setPartnerFormData({
      name: '',
      email: '',
      phone: '',
      equityPercentage: '',
      status: 'ACTIVE',
      joinedDate: formatInputDate(new Date()),
      notes: '',
    });
    setIsPartnerModalOpen(true);
  };

  // Open Edit Partner Modal
  const handleOpenEditPartner = (partner: Partner) => {
    setEditingPartner(partner);
    setPartnerFormData({
      name: partner.name,
      email: partner.email || '',
      phone: partner.phone || '',
      equityPercentage: partner.equityPercentage || '0',
      status: partner.status || 'ACTIVE',
      joinedDate: formatInputDate(partner.joinedDate),
      notes: partner.notes || '',
    });
    setIsPartnerModalOpen(true);
  };

  // Submit Partner
  const handleSubmitPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerFormData.name.trim()) {
      toast.error('Partner name is required');
      return;
    }

    try {
      setIsSubmittingPartner(true);
      const url = editingPartner ? `/api/partners/${editingPartner.id}` : '/api/partners';
      const method = editingPartner ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partnerFormData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save partner');

      toast.success(editingPartner ? 'Partner updated successfully' : 'Partner added successfully');
      setIsPartnerModalOpen(false);
      fetchData();
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Error saving partner');
    } finally {
      setIsSubmittingPartner(false);
    }
  };

  // Open Add Transaction Modal
  const handleOpenAddTxn = (defaultPartnerId?: string, defaultType: TransactionType = 'INVESTMENT') => {
    setEditingTxn(null);
    setTxnFormData({
      partnerId: defaultPartnerId || (partners.length > 0 ? partners[0].id : ''),
      type: defaultType,
      amount: '',
      transactionDate: formatInputDate(new Date()),
      paymentMethodId: paymentMethods.length > 0 ? paymentMethods[0].id : '',
      status: 'COMPLETED',
      referenceNumber: '',
      notes: '',
    });
    setIsTxnModalOpen(true);
  };

  // Open Edit Transaction Modal
  const handleOpenEditTxn = (txn: PartnerTransaction) => {
    setEditingTxn(txn);
    setTxnFormData({
      partnerId: txn.partnerId,
      type: txn.type,
      amount: txn.amount,
      transactionDate: formatInputDate(txn.transactionDate),
      paymentMethodId: txn.paymentMethodId || '',
      status: txn.status || 'COMPLETED',
      referenceNumber: txn.referenceNumber || '',
      notes: txn.notes || '',
    });
    setIsTxnModalOpen(true);
  };

  // Submit Transaction
  const handleSubmitTxn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txnFormData.partnerId) {
      toast.error('Please select a partner');
      return;
    }
    if (!txnFormData.amount || isNaN(Number(txnFormData.amount)) || Number(txnFormData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setIsSubmittingTxn(true);
      const url = editingTxn ? `/api/partners/transactions/${editingTxn.id}` : '/api/partners/transactions';
      const method = editingTxn ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txnFormData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save transaction');

      toast.success(editingTxn ? 'Transaction updated successfully' : 'Transaction recorded successfully');
      setIsTxnModalOpen(false);
      fetchData();
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Error recording transaction');
    } finally {
      setIsSubmittingTxn(false);
    }
  };

  // Delete Action Confirm
  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      if (deleteConfirm.type === 'partner') {
        const res = await fetch(`/api/partners/${deleteConfirm.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete partner');
        toast.success('Partner and related transactions removed');
      } else {
        const res = await fetch(`/api/partners/transactions/${deleteConfirm.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete transaction');
        toast.success('Transaction deleted');
      }
      setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
      fetchData();
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered partners
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.phone && p.phone.toLowerCase().includes(q))
      );
    });
  }, [partners, searchQuery]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchPartner = partnerFilter === 'ALL' || t.partnerId === partnerFilter;
      const matchType = typeFilter === 'ALL' || t.type === typeFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch = 
        !q ||
        (t.partnerName && t.partnerName.toLowerCase().includes(q)) ||
        (t.referenceNumber && t.referenceNumber.toLowerCase().includes(q)) ||
        (t.notes && t.notes.toLowerCase().includes(q)) ||
        (t.paymentMethodName && t.paymentMethodName.toLowerCase().includes(q));
      return matchPartner && matchType && matchSearch;
    });
  }, [transactions, partnerFilter, typeFilter, searchQuery]);

  const totalFund = summary?.totalInvested || 0;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!canViewPartners) {
    return <AccessDenied message="You do not have permission to view partners and capital investments." />;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <span>Partners &amp; Capital</span>
            </h1>
            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-foreground border border-border">
              Equity &amp; Capital
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Track partner investments, capital pools, equity stakes, and drawings.
          </p>
        </div>

        {/* Top Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {canManagePartners && (
            <button
              onClick={handleOpenAddPartner}
              className="px-3.5 py-2 min-h-[38px] text-xs font-medium text-foreground bg-muted hover:bg-muted/80 border border-border rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Users size={14} className="text-muted-foreground" />
              <span>Add Partner</span>
            </button>
          )}

          {canRecordTransaction && (
            <>
              <button
                onClick={() => handleOpenAddTxn(undefined, 'PAYOUT')}
                className="px-3.5 py-2 min-h-[38px] text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Banknote size={14} />
                <span>Record Payout</span>
              </button>

              <button
                onClick={() => handleOpenAddTxn()}
                className="px-4 py-2 min-h-[38px] text-xs font-semibold text-primary-foreground bg-primary hover:opacity-90 rounded-lg transition-opacity flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Record Transaction</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Stats & Distribution */}
      <PartnerSummaryCards summary={summary} partners={partners} />

      {/* Tabs & Search Filter Controls Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 flex-shrink-0">
        {/* Tab Selection Pills */}
        <div className="flex items-center overflow-x-auto no-scrollbar bg-card border border-border p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 min-h-[34px] text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-muted text-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users size={13} />
            <span>Partners ({partners.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1.5 min-h-[34px] text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ledger'
                ? 'bg-muted text-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Receipt size={13} />
            <span>Capital Ledger ({transactions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('captable')}
            className={`px-3 py-1.5 min-h-[34px] text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'captable'
                ? 'bg-muted text-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <PieChart size={13} />
            <span>Cap Table</span>
          </button>
        </div>

        {/* Search and Secondary Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
            <input
              type="text"
              placeholder={
                activeTab === 'overview'
                  ? 'Search partners...'
                  : 'Search transactions...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-2 min-h-[38px] bg-card border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border-hover transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {activeTab === 'ledger' && (
            <div className="flex items-center gap-1.5">
              <select
                value={partnerFilter}
                onChange={(e) => setPartnerFilter(e.target.value)}
                className="flex-1 sm:flex-initial bg-card border border-border rounded-lg px-2.5 py-2 min-h-[38px] text-xs text-foreground focus:outline-none focus:border-border-hover transition-colors"
              >
                <option value="ALL" className="bg-card text-foreground">All Partners</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id} className="bg-card text-foreground">
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="flex-1 sm:flex-initial bg-card border border-border rounded-lg px-2.5 py-2 min-h-[38px] text-xs text-foreground focus:outline-none focus:border-border-hover transition-colors"
              >
                <option value="ALL" className="bg-card text-foreground">All Types</option>
                <option value="PAYOUT" className="bg-card text-emerald-600 dark:text-emerald-400 font-semibold">Partner Payout</option>
                <option value="INVESTMENT" className="bg-card text-foreground">Capital In</option>
                <option value="WITHDRAWAL" className="bg-card text-foreground">Withdrawal</option>
                <option value="PROFIT_SHARE" className="bg-card text-foreground">Profit Share</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tab 1: Partners Overview */}
      {activeTab === 'overview' && (
        <PartnersOverviewTab
          partners={filteredPartners}
          totalFund={totalFund}
          searchQuery={searchQuery}
          onOpenAddPartner={handleOpenAddPartner}
          onAddInvestment={(partnerId) => handleOpenAddTxn(partnerId, 'INVESTMENT')}
          onAddWithdrawal={(partnerId) => handleOpenAddTxn(partnerId, 'WITHDRAWAL')}
          onAddPayout={(partnerId) => handleOpenAddTxn(partnerId, 'PAYOUT')}
          onViewLedger={(partner) => setSelectedPartnerForLedger(partner)}
          onEditPartner={handleOpenEditPartner}
          onDeletePartner={(partner) => {
            setDeleteConfirm({
              isOpen: true,
              type: 'partner',
              id: partner.id,
              title: `Delete Partner: ${partner.name}?`,
              message: `Are you sure you want to delete ${partner.name}? All recorded transactions associated with this partner will also be permanently deleted.`,
            });
          }}
        />
      )}

      {/* Tab 2: Master Ledger */}
      {activeTab === 'ledger' && (
        <MasterLedgerTab
          transactions={filteredTransactions}
          onOpenAddTxn={() => handleOpenAddTxn()}
          onEditTxn={handleOpenEditTxn}
          onDeleteTxn={(txn) => {
            setDeleteConfirm({
              isOpen: true,
              type: 'transaction',
              id: txn.id,
              title: 'Delete Transaction?',
              message: `Are you sure you want to delete this transaction of ${formatCurrency(txn.amount)}?`,
            });
          }}
        />
      )}

      {/* Tab 3: Cap Table */}
      {activeTab === 'captable' && (
        <CapTableTab partners={partners} summary={summary} />
      )}

      {/* Partner Detail History Drawer / Modal */}
      <PartnerLedgerModal
        partner={selectedPartnerForLedger}
        transactions={transactions}
        onClose={() => setSelectedPartnerForLedger(null)}
        onAddTransaction={(partnerId, defaultType) => handleOpenAddTxn(partnerId, defaultType)}
      />

      {/* Add / Edit Partner Modal */}
      <PartnerModal
        isOpen={isPartnerModalOpen}
        editingPartner={editingPartner}
        formData={partnerFormData}
        isSubmitting={isSubmittingPartner}
        onClose={() => setIsPartnerModalOpen(false)}
        onChange={setPartnerFormData}
        onSubmit={handleSubmitPartner}
      />

      {/* Record / Edit Transaction Modal */}
      <TransactionModal
        isOpen={isTxnModalOpen}
        editingTxn={editingTxn}
        partners={partners}
        paymentMethods={paymentMethods}
        formData={txnFormData}
        isSubmitting={isSubmittingTxn}
        onClose={() => setIsTxnModalOpen(false)}
        onChange={setTxnFormData}
        onSubmit={handleSubmitTxn}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
