'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  X, 
  Loader2, 
  Banknote, 
  CreditCard, 
  Hash, 
  Pencil, 
  Trash2, 
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmModal from '@/components/ConfirmModal';

import { Partner, PartnerTransaction, PaymentMethod } from '@/components/partners/types';
import { formatInputDate, formatCurrency, formatDisplayDate } from '@/components/partners/utils';
import { useAuth } from '@/context/AuthContext';
import AccessDenied from '@/components/AccessDenied';

interface PayoutFormData {
  partnerId: string;
  amount: string;
  transactionDate: string;
  paymentMethodId: string;
  referenceNumber: string;
  notes: string;
}

export default function PayoutsPage() {
  const { hasPermission } = useAuth();
  const canViewPayouts = hasPermission('payouts:view_self');
  const canManagePayouts = hasPermission('payouts:manage');

  const [loading, setLoading] = useState(true);

  const [partners, setPartners] = useState<Partner[]>([]);
  const [payouts, setPayouts] = useState<PartnerTransaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [partnerFilter, setPartnerFilter] = useState<string>('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('ALL');

  // Payout Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayout, setEditingPayout] = useState<PartnerTransaction | null>(null);
  const [formData, setFormData] = useState<PayoutFormData>({
    partnerId: '',
    amount: '',
    transactionDate: formatInputDate(new Date()),
    paymentMethodId: '',
    referenceNumber: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirm Delete Modal
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string;
    amount: string;
    partnerName: string;
  }>({
    isOpen: false,
    id: '',
    amount: '',
    partnerName: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch all partner and payout data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/partners');
      if (!res.ok) throw new Error('Failed to fetch partners data');
      const data = await res.json();
      const partnersList: Partner[] = data.partners || [];
      const allTransactions: PartnerTransaction[] = data.transactions || [];

      // Filter only completed PAYOUT transactions
      const payoutTransactions = allTransactions
        .filter((t) => t.type === 'PAYOUT')
        .map((t) => {
          const partner = partnersList.find((p) => p.id === t.partnerId);
          return {
            ...t,
            partnerName: t.partnerName || partner?.name || '—',
            partnerEmail: t.partnerEmail || partner?.email || null,
          };
        });

      setPartners(partnersList);
      setPayouts(payoutTransactions);
      setPaymentMethods(data.paymentMethods || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load payout data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  // Open Add Payout Modal
  const handleOpenAddPayout = (defaultPartnerId?: string) => {
    setEditingPayout(null);
    setFormData({
      partnerId: defaultPartnerId || (partners.length > 0 ? partners[0].id : ''),
      amount: '',
      transactionDate: formatInputDate(new Date()),
      paymentMethodId: paymentMethods.length > 0 ? paymentMethods[0].id : '',
      referenceNumber: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  // Open Edit Payout Modal
  const handleOpenEditPayout = (txn: PartnerTransaction) => {
    setEditingPayout(txn);
    setFormData({
      partnerId: txn.partnerId,
      amount: txn.amount,
      transactionDate: formatInputDate(txn.transactionDate),
      paymentMethodId: txn.paymentMethodId || '',
      referenceNumber: txn.referenceNumber || '',
      notes: txn.notes || '',
    });
    setIsModalOpen(true);
  };

  // Submit Payout
  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partnerId) {
      toast.error('Please select a partner');
      return;
    }
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      toast.error('Please enter a valid payout amount');
      return;
    }

    try {
      setIsSubmitting(true);
      const url = editingPayout ? `/api/partners/transactions/${editingPayout.id}` : '/api/partners/transactions';
      const method = editingPayout ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        type: 'PAYOUT',
        status: 'COMPLETED',
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save payout');

      toast.success(editingPayout ? 'Payout updated successfully' : 'Payout recorded successfully');
      setIsModalOpen(false);
      fetchData();
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Error recording payout');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Action Confirm
  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/partners/transactions/${deleteConfirm.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete payout');
      toast.success('Payout transaction deleted');
      setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
      fetchData();
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Failed to delete payout');
    } finally {
      setIsDeleting(false);
    }
  };

  // Metrics Calculations
  const metrics = useMemo(() => {
    const totalDistributed = payouts.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);
    
    // Payouts this month
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthPayouts = payouts
      .filter((p) => (p.transactionDate || '').startsWith(currentMonthPrefix))
      .reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);

    // Partners with payouts count
    const partnersWithPayoutsCount = partners.filter((partner) => (partner.totalPayout || 0) > 0).length;

    // Average payout transaction
    const avgPayout = payouts.length > 0 ? totalDistributed / payouts.length : 0;

    return {
      totalDistributed,
      thisMonthPayouts,
      partnersWithPayoutsCount,
      avgPayout,
      totalCount: payouts.length,
    };
  }, [payouts, partners]);

  // Filtered payouts list
  const filteredPayouts = useMemo(() => {
    return payouts.filter((p) => {
      const matchPartner = partnerFilter === 'ALL' || p.partnerId === partnerFilter;
      const matchPaymentMethod = paymentMethodFilter === 'ALL' || p.paymentMethodId === paymentMethodFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        (p.partnerName && p.partnerName.toLowerCase().includes(q)) ||
        (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q)) ||
        (p.paymentMethodName && p.paymentMethodName.toLowerCase().includes(q));

      return matchPartner && matchPaymentMethod && matchSearch;
    });
  }, [payouts, partnerFilter, paymentMethodFilter, searchQuery]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!canViewPayouts) {
    return <AccessDenied message="You do not have permission to view partner payouts." />;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Partner Payouts</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-neutral-300 border border-white/15">
              Payout Distributions
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Record, manage, and monitor all dividend payouts and profit withdrawals taken by partners.
          </p>
        </div>

        {/* Top Header Action Buttons */}
        {canManagePayouts && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenAddPayout()}
              className="px-4 py-2 min-h-[40px] text-xs font-semibold text-black bg-white hover:bg-neutral-200 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Record Payout</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Payouts */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5">
          <p className="text-xs font-medium text-white/60 mb-1 uppercase tracking-wider">Total Payouts Distributed</p>
          <p className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
            {formatCurrency(metrics.totalDistributed)}
          </p>
          <p className="mt-1 text-xs text-white/40">
            {metrics.totalCount} {metrics.totalCount === 1 ? 'payout recorded' : 'payouts recorded'}
          </p>
        </div>

        {/* Card 2: This Month's Payouts */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5">
          <p className="text-xs font-medium text-white/60 mb-1 uppercase tracking-wider">This Month Payouts</p>
          <p className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
            {formatCurrency(metrics.thisMonthPayouts)}
          </p>
          <p className="mt-1 text-xs text-white/40">
            Current calendar month
          </p>
        </div>

        {/* Card 3: Partners with Payouts */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5">
          <p className="text-xs font-medium text-white/60 mb-1 uppercase tracking-wider">Beneficiary Partners</p>
          <p className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
            {metrics.partnersWithPayoutsCount} / {partners.length}
          </p>
          <p className="mt-1 text-xs text-white/40">
            Partners who received payouts
          </p>
        </div>

        {/* Card 4: Average Payout */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5">
          <p className="text-xs font-medium text-white/60 mb-1 uppercase tracking-wider">Average Per Payout</p>
          <p className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
            {formatCurrency(metrics.avgPayout)}
          </p>
          <p className="mt-1 text-xs text-white/40">
            Across all transactions
          </p>
        </div>
      </div>

      {/* Partner Payout Quick Summary Cards */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60">Partner Payout Summary</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-neutral-300">
              {partners.length} {partners.length === 1 ? 'Partner' : 'Partners'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {partners.map((partner) => {
            const partnerPayouts = payouts.filter((p) => p.partnerId === partner.id);
            const totalPayoutAmt = partner.totalPayout || 0;
            const payoutShare = metrics.totalDistributed > 0 ? ((totalPayoutAmt / metrics.totalDistributed) * 100).toFixed(1) : '0.0';

            return (
              <div
                key={partner.id}
                className="bg-black/40 border border-white/5 hover:border-white/15 rounded-xl p-3.5 flex flex-col justify-between transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-white truncate">{partner.name}</h4>
                      <p className="text-[11px] text-white/40">Equity: <span className="font-mono text-white/70">{partner.equityPercentage}%</span></p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-white/5 text-white/60 border border-white/5">
                      {payoutShare}% Share
                    </span>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs text-white/50">Total Payouts:</span>
                    <span className="text-base font-bold font-mono text-white">
                      {formatCurrency(totalPayoutAmt)}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[11px] text-white/40">
                    <span>Transactions:</span>
                    <span className="font-mono text-white/60">{partnerPayouts.length} entries</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-end">
                  <button
                    onClick={() => handleOpenAddPayout(partner.id)}
                    className="w-full py-2 min-h-[38px] px-3 text-xs font-medium text-white/90 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Banknote size={13} className="text-white/60" />
                    <span>Record Payout</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search by partner, UTR, notes..."
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

          <div className="flex items-center gap-2">
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
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="flex-1 sm:flex-initial bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 min-h-[40px] text-base md:text-xs text-white focus:outline-none focus:border-white/20 transition-colors"
            >
              <option value="ALL" className="bg-neutral-900 text-white">All Payment Methods</option>
              {paymentMethods.map((pm) => (
                <option key={pm.id} value={pm.id} className="bg-neutral-900 text-white">
                  {pm.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs text-neutral-400 self-end md:self-center font-mono">
          Showing {filteredPayouts.length} {filteredPayouts.length === 1 ? 'payout' : 'payouts'}
        </span>
      </div>

      {/* Payouts Ledger Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white">
              Payout History Ledger
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-neutral-300">
              {filteredPayouts.length} {filteredPayouts.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Partner</th>
                <th className="py-3 px-4">Payout Amount</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Reference / UTR</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-neutral-500 space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 mb-2">
                      <Banknote size={20} className="text-neutral-400" />
                    </div>
                    <div className="text-sm font-medium text-neutral-300">
                      No payout records found
                    </div>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                      Record profit distributions and partner payouts to see them logged in this ledger.
                    </p>
                    <button
                      onClick={() => handleOpenAddPayout()}
                      className="mt-2 inline-flex items-center justify-center gap-1.5 px-4 py-2 min-h-[44px] bg-white hover:bg-neutral-200 text-black rounded-xl text-xs font-semibold transition-all shadow-sm"
                    >
                      <Plus size={14} />
                      <span>Record First Payout</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredPayouts.map((txn) => (
                  <tr key={txn.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-3.5 px-4 text-neutral-300 whitespace-nowrap text-xs font-mono">
                      {formatDisplayDate(txn.transactionDate)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white whitespace-nowrap">
                      {txn.partnerName || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-bold font-mono whitespace-nowrap text-white">
                      {formatCurrency(txn.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-300 whitespace-nowrap text-xs">
                      {txn.paymentMethodName ? (
                        <span className="inline-flex items-center gap-1">
                          <CreditCard size={11} className="text-neutral-500" />
                          {txn.paymentMethodName}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-400 font-mono text-xs whitespace-nowrap">
                      {txn.referenceNumber ? (
                        <span className="inline-flex items-center gap-1">
                          <Hash size={11} className="text-neutral-500" />
                          {txn.referenceNumber}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-400 text-xs max-w-xs truncate">
                      {txn.notes || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditPayout(txn)}
                          className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                          title="Edit payout"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirm({
                              isOpen: true,
                              id: txn.id,
                              amount: txn.amount,
                              partnerName: txn.partnerName || 'Partner',
                            });
                          }}
                          className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                          title="Delete payout"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record / Edit Payout Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[90dvh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02] flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/5 text-white/70 border border-white/10">
                  <Banknote size={16} />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingPayout ? 'Edit Partner Payout' : 'Record Partner Payout'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitPayout} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Select Partner <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={formData.partnerId}
                  onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}
                  className="w-full min-h-[44px] px-3 bg-[#2a2a2a] border border-white/10 rounded-xl text-base sm:text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                >
                  <option value="" disabled className="bg-neutral-900 text-neutral-500">Select a partner</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id} className="bg-neutral-900 text-white">
                      {p.name} ({p.equityPercentage}% Equity)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Payout Amount (₹) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 50000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 bg-white/5 border border-white/10 rounded-xl text-base sm:text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20 transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Payout Date</label>
                  <input
                    type="date"
                    required
                    value={formData.transactionDate}
                    onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 bg-white/5 border border-white/10 rounded-xl text-base sm:text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Payment Method</label>
                <select
                  value={formData.paymentMethodId}
                  onChange={(e) => setFormData({ ...formData, paymentMethodId: e.target.value })}
                  className="w-full min-h-[44px] px-3 bg-[#2a2a2a] border border-white/10 rounded-xl text-base sm:text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                >
                  <option value="" className="bg-neutral-900 text-white">None / Cash</option>
                  {paymentMethods.map((pm) => (
                    <option key={pm.id} value={pm.id} className="bg-neutral-900 text-white">
                      {pm.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Reference Number / UTR / Txn ID</label>
                <input
                  type="text"
                  placeholder="e.g. UPI/2026/10/123456 or Bank Ref"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  className="w-full min-h-[44px] px-3.5 bg-white/5 border border-white/10 rounded-xl text-base sm:text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20 font-mono transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Notes &amp; Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Monthly dividend transfer / profit payout..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-base sm:text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20 resize-none transition-colors"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-medium text-neutral-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2.5 min-h-[44px] bg-white hover:bg-neutral-200 text-black text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>{editingPayout ? 'Save Changes' : 'Record Payout'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Payout Record?"
        message={`Are you sure you want to delete this payout of ${formatCurrency(deleteConfirm.amount)} for ${deleteConfirm.partnerName}?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
        confirmText="Delete Payout"
        isLoading={isDeleting}
      />
    </div>
  );
}
