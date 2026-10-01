'use client';

import { X, Check, Loader2 } from 'lucide-react';
import { Partner, PartnerTransaction, PaymentMethod, TransactionType } from './types';

export interface TransactionFormData {
  partnerId: string;
  type: TransactionType;
  amount: string;
  transactionDate: string;
  paymentMethodId: string;
  status: string;
  referenceNumber: string;
  notes: string;
}

interface TransactionModalProps {
  isOpen: boolean;
  editingTxn: PartnerTransaction | null;
  partners: Partner[];
  paymentMethods: PaymentMethod[];
  formData: TransactionFormData;
  isSubmitting: boolean;
  onClose: () => void;
  onChange: (data: TransactionFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function TransactionModal({
  isOpen,
  editingTxn,
  partners,
  paymentMethods,
  formData,
  isSubmitting,
  onClose,
  onChange,
  onSubmit,
}: TransactionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/30">
          <h3 className="text-lg font-bold text-white">
            {editingTxn ? 'Edit Capital Transaction' : 'Record Capital Transaction'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">
              Select Partner <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={formData.partnerId}
              onChange={(e) => onChange({ ...formData, partnerId: e.target.value })}
              className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/25 transition-colors"
            >
              <option value="" disabled className="bg-neutral-900 text-white/40">Select a partner</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id} className="bg-neutral-900 text-white">
                  {p.name} ({p.equityPercentage}% Equity)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                Transaction Type <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => onChange({ ...formData, type: e.target.value as TransactionType })}
                className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/25 transition-colors"
              >
                <option value="INVESTMENT" className="bg-neutral-900 text-white">Capital Investment (In)</option>
                <option value="WITHDRAWAL" className="bg-neutral-900 text-white">Capital Withdrawal (Out)</option>
                <option value="PROFIT_SHARE" className="bg-neutral-900 text-white">Profit Share</option>
                <option value="PAYOUT" className="bg-neutral-900 text-white">Dividend / Payout</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                Amount (₹) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                placeholder="e.g. 50000"
                value={formData.amount}
                onChange={(e) => onChange({ ...formData, amount: e.target.value })}
                className="w-full h-10 px-3.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 transition-colors font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">Transaction Date</label>
              <input
                type="date"
                required
                value={formData.transactionDate}
                onChange={(e) => onChange({ ...formData, transactionDate: e.target.value })}
                className="w-full h-10 px-3.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/25 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">Payment Method</label>
              <select
                value={formData.paymentMethodId}
                onChange={(e) => onChange({ ...formData, paymentMethodId: e.target.value })}
                className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/25 transition-colors"
              >
                <option value="" className="bg-neutral-900 text-white">None / Cash</option>
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id} className="bg-neutral-900 text-white">
                    {pm.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">Reference Number / UTR / Txn ID</label>
            <input
              type="text"
              placeholder="e.g. UPI/2026/09/123456 or Bank Transfer Ref"
              value={formData.referenceNumber}
              onChange={(e) => onChange({ ...formData, referenceNumber: e.target.value })}
              className="w-full h-10 px-3.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 font-mono text-xs transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">Notes & Description</label>
            <textarea
              rows={2}
              placeholder="e.g. Initial seed capital contribution or monthly dividend payout..."
              value={formData.notes}
              onChange={(e) => onChange({ ...formData, notes: e.target.value })}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 resize-none transition-colors"
            />
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-white text-black hover:bg-neutral-200 text-sm font-medium rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              <span>{editingTxn ? 'Save Changes' : 'Record Transaction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
