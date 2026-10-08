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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-card border border-border rounded-xl w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-border bg-muted/20 shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-foreground">Edit Bill Details</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Month: {entry.month}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
          {/* Bill Name */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Bill / Expense Name <span className="text-muted-foreground">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 min-h-[38px] bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors text-xs"
            />
          </div>

          {/* Amount & Due Day */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Expected Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={expectedAmount}
                  onChange={(e) => setExpectedAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 min-h-[38px] bg-background border border-border rounded-lg text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Due Day of Month
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                placeholder="e.g. 5"
                className="w-full px-3 py-2 min-h-[38px] bg-background border border-border rounded-lg text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors text-xs"
              />
            </div>
          </div>

          {/* Actual amount if paid */}
          {entry.status === 'PAID' && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Actual Amount Settled (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={actualAmount}
                  onChange={(e) => setActualAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 min-h-[38px] bg-background border border-border rounded-lg text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-ring transition-colors text-xs"
                />
              </div>
            </div>
          )}

          {/* Category & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 min-h-[38px] bg-background border border-border rounded-lg text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value} className="bg-popover text-popover-foreground">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethodId}
                onChange={(e) => setPaymentMethodId(e.target.value)}
                className="w-full px-3 py-2 min-h-[38px] bg-background border border-border rounded-lg text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
              >
                <option value="" className="bg-popover text-popover-foreground">Select Method</option>
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id} className="bg-popover text-popover-foreground">
                    {pm.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Consumer ID, Account details"
              className="w-full px-3 py-2 min-h-[38px] bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors text-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-border">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-2 min-h-[38px] text-xs font-medium text-rose-600 dark:text-rose-300 hover:text-rose-700 dark:hover:text-rose-200 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 size={13} />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-3.5 py-2 min-h-[38px] text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg bg-muted hover:bg-muted/80 border border-border transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-4 py-2 min-h-[38px] text-xs font-semibold text-primary-foreground bg-primary hover:opacity-90 disabled:opacity-50 rounded-lg transition-opacity flex items-center justify-center gap-1.5"
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
