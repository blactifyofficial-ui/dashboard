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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-neutral-800 bg-neutral-950 shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Mark as Paid
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5 truncate max-w-xs">{entry.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
          {/* Amount Paid */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Amount Paid (₹) <span className="text-neutral-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-xs">₹</span>
              <input
                type="number"
                step="0.01"
                required
                value={actualAmount}
                onChange={(e) => setActualAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3.5 py-2 min-h-[38px] bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors text-xs"
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
                Paid Date <span className="text-neutral-500">*</span>
              </label>
              <input
                type="date"
                required
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className="w-full px-3 py-2 min-h-[38px] bg-neutral-950 border border-neutral-800 rounded-lg text-white text-xs focus:outline-none focus:border-neutral-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethodId}
                onChange={(e) => setPaymentMethodId(e.target.value)}
                className="w-full px-3 py-2 min-h-[38px] bg-neutral-950 border border-neutral-800 rounded-lg text-white text-xs focus:outline-none focus:border-neutral-500 transition-colors"
              >
                <option value="" className="bg-neutral-900 text-white">Select Method</option>
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id} className="bg-neutral-900 text-white">
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                <Hash size={13} />
              </span>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. UPI-20261001-9988"
                className="w-full pl-8 pr-3.5 py-2 min-h-[38px] bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors text-xs"
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
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors text-xs resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 min-h-[38px] text-xs font-medium text-neutral-300 hover:text-white rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 min-h-[38px] text-xs font-semibold text-black bg-white hover:bg-neutral-200 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5"
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
