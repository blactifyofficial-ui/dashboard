'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  X,
  Users,
  Receipt,
  PieChart,
  Lock,
  KeyRound,
  Loader2,
  Banknote
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmModal from '@/components/ConfirmModal';
import { verifyRevenuePin } from '@/app/actions/revenuePin';

import { Partner, PartnerTransaction, PaymentMethod, SummaryData, TransactionType } from '@/components/partners/types';
import { formatInputDate, formatCurrency } from '@/components/partners/utils';
import PartnerSummaryCards from '@/components/partners/PartnerSummaryCards';
import PartnersOverviewTab from '@/components/partners/PartnersOverviewTab';
import MasterLedgerTab from '@/components/partners/MasterLedgerTab';
import CapTableTab from '@/components/partners/CapTableTab';
import PartnerModal, { PartnerFormData } from '@/components/partners/PartnerModal';
import TransactionModal, { TransactionFormData } from '@/components/partners/TransactionModal';
import PartnerLedgerModal from '@/components/partners/PartnerLedgerModal';

export default function PartnersPage() {
  const [loading, setLoading] = useState(true);
  // Always start locked on mount (requires PIN on every visit/page switch)
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');

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

  // Auto-lock on tab switch / window blur / unmount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('partners_unlocked');
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsUnlocked(false);
        setPinInput('');
        setPinError('');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('partners_unlocked');
      }
    };
  }, []);

  // Handle PIN verification
  const handleVerifyPin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pinInput.trim()) return;

    try {
      setPinLoading(true);
      setPinError('');
      const isValid = await verifyRevenuePin(pinInput.trim());
      if (isValid) {
        setIsUnlocked(true);
        toast.success('Access granted');
        fetchData();
      } else {
        setPinError('Invalid PIN. Please try again.');
      }
    } catch {
      setPinError('An error occurred during verification');
    } finally {
      setPinLoading(false);
    }
  };

  // Handle Lock
  const handleLock = () => {
    setIsUnlocked(false);
    setPinInput('');
    setPinError('');
    toast.success('Partners & Capital locked');
  };

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

  if (isUnlocked && loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px] p-4">
        <div className="w-full max-w-md bg-white/[0.03] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden text-center">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-1/2 translate-x-1/2 -mt-10 w-44 h-44 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-white shadow-lg">
              <Lock size={24} className="text-white/80" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
              Partners & Capital
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-xs mb-6">
              Enter your PIN to view partner equity, cap table, and transactions.
            </p>

            <form onSubmit={handleVerifyPin} className="w-full space-y-4">
              <div className="relative">
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (pinError) setPinError('');
                  }}
                  placeholder="Enter PIN"
                  className="w-full bg-black/40 border border-white/15 focus:border-white/30 rounded-xl h-12 px-4 text-center text-lg tracking-widest text-white placeholder:text-neutral-500 placeholder:tracking-normal focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
                  autoFocus
                />
              </div>

              {pinError && (
                <p className="text-red-400 text-xs font-medium">
                  {pinError}
                </p>
              )}

              <button
                type="submit"
                disabled={pinLoading || pinInput.trim().length === 0}
                className="w-full h-11 bg-white hover:bg-neutral-200 text-black font-semibold text-sm rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {pinLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <KeyRound size={16} />
                    <span>Unlock Page</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Partners &amp; Capital</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-neutral-300 border border-white/15">
              Equity &amp; Capital
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Track partner investments, capital pools, equity stakes, and drawings.
          </p>
        </div>

        {/* Top Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleLock}
            className="p-2.5 min-h-[40px] min-w-[40px] text-xs font-medium text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            title="Lock Page"
          >
            <Lock size={15} />
          </button>

          <button
            onClick={handleOpenAddPartner}
            className="px-3.5 py-2 min-h-[40px] text-xs font-medium text-neutral-200 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Users size={14} className="text-white/60" />
            <span>Add Partner</span>
          </button>

          <button
            onClick={() => handleOpenAddTxn(undefined, 'PAYOUT')}
            className="px-3.5 py-2 min-h-[40px] text-xs font-semibold text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <Banknote size={14} />
            <span>Record Payout</span>
          </button>

          <button
            onClick={() => handleOpenAddTxn()}
            className="px-4 py-2 min-h-[40px] text-xs font-semibold text-black bg-white hover:bg-neutral-200 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span>Record Transaction</span>
          </button>
        </div>
      </div>

      {/* KPI Stats & Distribution */}
      <PartnerSummaryCards summary={summary} partners={partners} />

      {/* Tabs & Search Filter Controls Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 flex-shrink-0">
        {/* Tab Selection Pills */}
        <div className="flex items-center overflow-x-auto no-scrollbar bg-white/5 border border-white/10 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 min-h-[36px] text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-white/15 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Users size={13} />
            <span>Partners ({partners.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-2 min-h-[36px] text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ledger'
                ? 'bg-white/15 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Receipt size={13} />
            <span>Capital Ledger ({transactions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('captable')}
            className={`px-3 py-2 min-h-[36px] text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'captable'
                ? 'bg-white/15 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <PieChart size={13} />
            <span>Cap Table</span>
          </button>
        </div>

        {/* Search and Secondary Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder={
                activeTab === 'overview'
                  ? 'Search partners...'
                  : 'Search transactions...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 min-h-[40px] bg-white/5 border border-white/10 rounded-xl text-base md:text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {activeTab === 'ledger' && (
            <div className="flex items-center gap-1.5">
              <select
                value={partnerFilter}
                onChange={(e) => setPartnerFilter(e.target.value)}
                className="flex-1 sm:flex-initial bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 min-h-[40px] text-base md:text-xs text-white focus:outline-none focus:border-white/20 transition-colors"
              >
                <option value="ALL" className="bg-neutral-900 text-white">All Partners</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id} className="bg-neutral-900 text-white">
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="flex-1 sm:flex-initial bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 min-h-[40px] text-base md:text-xs text-white focus:outline-none focus:border-white/20 transition-colors"
              >
                <option value="ALL" className="bg-neutral-900 text-white">All Types</option>
                <option value="PAYOUT" className="bg-neutral-900 text-white">Partner Payout</option>
                <option value="INVESTMENT" className="bg-neutral-900 text-white">Capital In</option>
                <option value="WITHDRAWAL" className="bg-neutral-900 text-white">Withdrawal</option>
                <option value="PROFIT_SHARE" className="bg-neutral-900 text-white">Profit Share</option>
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
