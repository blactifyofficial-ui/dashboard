'use client';

import { useState } from 'react';
import { X, Check, Trash2 } from 'lucide-react';
import { MonthlyExpenseEntry, PaymentMethod } from './types';
import { EXPENSE_CATEGORIES } from './AddEntryModal';

interface EditEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: MonthlyExpenseEntry | null;
  paymentMethods: PaymentMethod[];
  onUpdate: (data: {
    id: string;
    name: string;
    category: string;
    expectedAmount: string;
    actualAmount: string;
    dueDay: string;
    paymentMethodId: string;
    notes: string;
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

interface EditEntryFormProps {
  onClose: () => void;
  entry: MonthlyExpenseEntry;
  paymentMethods: PaymentMethod[];
  onUpdate: EditEntryModalProps['onUpdate'];
  onDelete: EditEntryModalProps['onDelete'];
}

function EditEntryForm({
  onClose,
  entry,
  paymentMethods,
  onUpdate,
  onDelete,
}: EditEntryFormProps) {
  const [name, setName] = useState(entry.name || '');
  const [category, setCategory] = useState(entry.category || 'OPERATIONAL');
  const [expectedAmount, setExpectedAmount] = useState(entry.expectedAmount || '0');
  const [actualAmount, setActualAmount] = useState(entry.actualAmount || '0');
  const [dueDay, setDueDay] = useState(entry.dueDay || '');
  const [paymentMethodId, setPaymentMethodId] = useState(entry.paymentMethodId || '');
  const [notes, setNotes] = useState(entry.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      await onUpdate({
        id: entry.id,
        name: name.trim(),
        category,
        expectedAmount: expectedAmount || '0',
        actualAmount: actualAmount || '0',
        dueDay,
        paymentMethodId,
        notes: notes.trim(),
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Remove "${entry.name}" from this month?`)) {
      try {
        setIsDeleting(true);
        await onDelete(entry.id);
        onClose();
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-white/5 shrink-0">
          <div>
            <h3 className="text-base font-semibold text-white">Edit Bill Details</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Month: {entry.month}</p>
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
          {/* Bill Name */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Bill / Expense Name <span className="text-white/60">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-neutral-950/60 border border-white/10 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/30 transition-colors text-base md:text-sm"
            />
          </div>

          {/* Amount & Due Day */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Expected Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-base md:text-xs">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={expectedAmount}
                  onChange={(e) => setExpectedAmount(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 min-h-[44px] bg-neutral-950/60 border border-white/10 rounded-xl text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:border-white/30 transition-colors text-base md:text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Due Day of Month
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                placeholder="e.g. 5"
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-neutral-950/60 border border-white/10 rounded-xl text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:border-white/30 transition-colors text-base md:text-xs"
              />
            </div>
          </div>

          {/* Actual amount if paid */}
          {entry.status === 'PAID' && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Actual Amount Settled (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-base md:text-xs">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={actualAmount}
                  onChange={(e) => setActualAmount(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 min-h-[44px] bg-neutral-950/60 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-white/30 transition-colors text-base md:text-xs"
                />
              </div>
            </div>
          )}

          {/* Category & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-neutral-950/60 border border-white/10 rounded-xl text-white text-base md:text-xs focus:outline-none focus:border-white/30 transition-colors"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value} className="bg-[#121212] text-white">
                    {c.label}
                  </option>
                ))}
              </select>
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

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Consumer ID, Account details"
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-neutral-950/60 border border-white/10 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/30 transition-colors text-base md:text-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3.5 h-11 min-h-[44px] text-xs font-medium text-rose-400 hover:text-rose-300 rounded-xl hover:bg-rose-500/10 transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 size={14} />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 h-11 min-h-[44px] text-xs font-medium text-neutral-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-5 h-11 min-h-[44px] text-xs font-semibold text-black bg-white hover:bg-neutral-200 disabled:opacity-50 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <Check size={14} />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditEntryModal({
  isOpen,
  onClose,
  entry,
  paymentMethods,
  onUpdate,
  onDelete,
}: EditEntryModalProps) {
  if (!isOpen || !entry) return null;

  return (
    <EditEntryForm
      key={entry.id}
      entry={entry}
      paymentMethods={paymentMethods}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onClose={onClose}
    />
  );
}
