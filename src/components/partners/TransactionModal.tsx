'use client';

import { X, Check, Loader2, Landmark } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[90dvh] flex flex-col">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-muted/30 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-muted text-foreground border border-border">
              <Landmark size={16} />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {editingTxn 
                ? (formData.type === 'PAYOUT' ? 'Edit Partner Payout' : 'Edit Capital Transaction')
                : (formData.type === 'PAYOUT' ? 'Record Partner Payout' : 'Record Capital Transaction')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Select Partner <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={formData.partnerId}
              onChange={(e) => onChange({ ...formData, partnerId: e.target.value })}
              className="w-full min-h-[40px] px-3 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-border-hover transition-colors"
            >
              <option value="" disabled className="bg-card text-muted-foreground">Select a partner</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id} className="bg-card text-foreground">
                  {p.name} ({p.equityPercentage}% Equity)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Transaction Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => onChange({ ...formData, type: e.target.value as TransactionType })}
                className="w-full min-h-[40px] px-3 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-border-hover transition-colors"
              >
                <option value="PAYOUT" className="bg-card text-emerald-600 dark:text-emerald-400 font-semibold">Partner Payout</option>
                <option value="INVESTMENT" className="bg-card text-foreground">Capital Investment (In)</option>
                <option value="WITHDRAWAL" className="bg-card text-foreground">Capital Withdrawal (Out)</option>
                <option value="PROFIT_SHARE" className="bg-card text-foreground">Profit Share</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="1"
                required
                placeholder="e.g. 50000"
                value={formData.amount}
                onChange={(e) => onChange({ ...formData, amount: e.target.value })}
                className="w-full min-h-[40px] px-3 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border-hover focus:ring-1 focus:ring-foreground/20 transition-colors font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Transaction Date</label>
              <input
                type="date"
                required
                value={formData.transactionDate}
                onChange={(e) => onChange({ ...formData, transactionDate: e.target.value })}
                className="w-full min-h-[40px] px-3 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-border-hover transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Payment Method</label>
              <select
                value={formData.paymentMethodId}
                onChange={(e) => onChange({ ...formData, paymentMethodId: e.target.value })}
                className="w-full min-h-[40px] px-3 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-border-hover transition-colors"
              >
                <option value="" className="bg-card text-foreground">None / Cash</option>
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id} className="bg-card text-foreground">
                    {pm.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Reference Number / UTR / Txn ID</label>
            <input
              type="text"
              placeholder="e.g. UPI/2026/09/123456 or Bank Transfer Ref"
              value={formData.referenceNumber}
              onChange={(e) => onChange({ ...formData, referenceNumber: e.target.value })}
              className="w-full min-h-[40px] px-3 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border-hover focus:ring-1 focus:ring-foreground/20 font-mono transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Notes &amp; Description</label>
            <textarea
              rows={2}
              placeholder="e.g. Partner monthly payout / dividend transfer..."
              value={formData.notes}
              onChange={(e) => onChange({ ...formData, notes: e.target.value })}
              className="w-full p-3 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border-hover focus:ring-1 focus:ring-foreground/20 resize-none transition-colors"
            />
          </div>

          <div className="pt-3 border-t border-border flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 min-h-[38px] rounded-lg text-xs font-medium text-foreground bg-muted hover:bg-muted/80 border border-border transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 min-h-[38px] bg-primary text-primary-foreground hover:opacity-90 active:opacity-80 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              <span>
                {editingTxn 
                  ? 'Save Changes' 
                  : (formData.type === 'PAYOUT' ? 'Record Payout' : 'Record Transaction')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
