'use client';

import { useState } from 'react';
import { X, Check, Hash } from 'lucide-react';
import { MonthlyExpenseEntry, PaymentMethod } from './types';

interface EntryPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: MonthlyExpenseEntry | null;
  paymentMethods: PaymentMethod[];
  onSubmit: (data: {
    id: string;
    status: 'PAID' | 'PENDING';
    actualAmount: string;
    paidDate: string;
    paymentMethodId: string;
    referenceNumber: string;
    notes: string;
  }) => Promise<void>;
}

interface EntryPaymentFormProps {
  onClose: () => void;
  entry: MonthlyExpenseEntry;
  paymentMethods: PaymentMethod[];
  onSubmit: EntryPaymentModalProps['onSubmit'];
}

function EntryPaymentForm({
  onClose,
  entry,
  paymentMethods,
  onSubmit,
}: EntryPaymentFormProps) {
  const [actualAmount, setActualAmount] = useState(() => {
    const exp = parseFloat(entry.expectedAmount || '0') || 0;
    const act = parseFloat(entry.actualAmount || '0') || 0;
    return act > 0 ? entry.actualAmount : (exp > 0 ? entry.expectedAmount : '');
  });

  const [paidDate, setPaidDate] = useState(() => {
    const now = new Date();
    return entry.paidDate
      ? new Date(entry.paidDate).toISOString().split('T')[0]
      : now.toISOString().split('T')[0];
  });

  const [paymentMethodId, setPaymentMethodId] = useState(
    () => entry.paymentMethodId || (paymentMethods.length > 0 ? paymentMethods[0].id : '')
  );
  const [referenceNumber, setReferenceNumber] = useState(() => entry.referenceNumber || '');
  const [notes, setNotes] = useState(() => entry.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onSubmit({
        id: entry.id,
        status: 'PAID',
        actualAmount: actualAmount || entry.expectedAmount || '0',
        paidDate,
        paymentMethodId,
        referenceNumber,
        notes,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-white/5 shrink-0">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white" />
              Mark as Paid
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5 truncate max-w-xs">{entry.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Amount Paid */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Amount Paid (₹) <span className="text-white/60">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-base md:text-sm">₹</span>
              <input
                type="number"
                step="0.01"
                required
                value={actualAmount}
                onChange={(e) => setActualAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 min-h-[44px] bg-neutral-950/60 border border-white/10 rounded-xl text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:border-white/30 transition-colors text-base md:text-sm"
              />
            </div>
            {entry.expectedAmount && parseFloat(entry.expectedAmount) > 0 && (
              <p className="text-[11px] text-neutral-500 mt-1">
                Expected budget: ₹{Number(entry.expectedAmount).toLocaleString('en-IN')}
              </p>
            )}
          </div>

          {/* Paid Date & Payment Method Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Paid Date <span className="text-white/60">*</span>
              </label>
              <input
                type="date"
                required
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-neutral-950/60 border border-white/10 rounded-xl text-white text-base md:text-xs focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethodId}
                onChange={(e) => setPaymentMethodId(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-neutral-950/60 border border-white/10 rounded-xl text-white text-base md:text-xs focus:outline-none focus:border-white/30 transition-colors"
              >
                <option value="" className="bg-[#121212] text-white">Select Method</option>
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id} className="bg-[#121212] text-white">
                    {pm.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reference / Transaction ID */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Reference / UPI ID / Receipt #
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500">
                <Hash size={15} />
              </span>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. UPI-20261001-9988, Cheque #104"
                className="w-full pl-9 pr-4 py-2.5 min-h-[44px] bg-neutral-950/60 border border-white/10 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/30 transition-colors text-base md:text-xs"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid for September meter reading"
              rows={2}
              className="w-full px-3.5 py-2.5 bg-neutral-950/60 border border-white/10 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/30 transition-colors text-base md:text-xs resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-11 min-h-[44px] text-xs font-medium text-neutral-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 h-11 min-h-[44px] text-xs font-semibold text-black bg-white hover:bg-neutral-200 disabled:opacity-50 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <Check size={14} />
              {isSubmitting ? 'Saving...' : 'Confirm Paid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EntryPaymentModal({
  isOpen,
  onClose,
  entry,
  paymentMethods,
  onSubmit,
}: EntryPaymentModalProps) {
  if (!isOpen || !entry) return null;

  return (
    <EntryPaymentForm
      key={entry.id}
      entry={entry}
      paymentMethods={paymentMethods}
      onSubmit={onSubmit}
      onClose={onClose}
    />
  );
}
