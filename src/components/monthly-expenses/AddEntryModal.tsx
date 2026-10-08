'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { PaymentMethod } from './types';

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  month: string;
  monthLabel: string;
  paymentMethods: PaymentMethod[];
  onAdd: (data: {
    month: string;
    name: string;
    category: string;
    expectedAmount: string;
    dueDay: string;
    notes: string;
    paymentMethodId: string;
    saveToTemplate: boolean;
  }) => Promise<void>;
}

export const EXPENSE_CATEGORIES = [
  { value: 'RENT', label: 'Rent & Property' },
  { value: 'UTILITIES', label: 'Utilities (Electricity, Water, Gas)' },
  { value: 'SALARY', label: 'Salaries & Staff' },
  { value: 'SOFTWARE', label: 'Software & Subscriptions' },
  { value: 'MAINTENANCE', label: 'Maintenance & Cleaning' },
  { value: 'MARKETING', label: 'Marketing & Ads' },
  { value: 'OPERATIONAL', label: 'Operational & Other' },
];

export default function AddEntryModal({
  isOpen,
  onClose,
  month,
  monthLabel,
  paymentMethods,
  onAdd,
}: AddEntryModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('OPERATIONAL');
  const [expectedAmount, setExpectedAmount] = useState('');
  const [dueDay, setDueDay] = useState('5');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [notes, setNotes] = useState('');
  const [saveToTemplate, setSaveToTemplate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      await onAdd({
        month,
        name: name.trim(),
        category,
        expectedAmount: expectedAmount || '0',
        dueDay,
        notes: notes.trim(),
        paymentMethodId,
        saveToTemplate,
      });
      setName('');
      setExpectedAmount('');
      setNotes('');
      setSaveToTemplate(false);
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
              <Plus size={15} className="text-neutral-400" />
              Add Monthly Bill / Expense
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">For {monthLabel}</p>
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
          {/* Bill Name */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Bill / Expense Name <span className="text-neutral-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Warehouse Rent, Generator Diesel"
              className="w-full px-3 py-2 min-h-[38px] bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors text-xs"
            />
          </div>

          {/* Amount & Due Day */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Expected Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-xs">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={expectedAmount}
                  onChange={(e) => setExpectedAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 min-h-[38px] bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors text-xs"
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
                className="w-full px-3 py-2 min-h-[38px] bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors text-xs"
              />
            </div>
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 min-h-[38px] bg-neutral-950 border border-neutral-800 rounded-lg text-white text-xs focus:outline-none focus:border-neutral-500 transition-colors"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value} className="bg-neutral-900 text-white">
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
                className="w-full px-3 py-2 min-h-[38px] bg-neutral-950 border border-neutral-800 rounded-lg text-white text-xs focus:outline-none focus:border-neutral-500 transition-colors"
              >
                <option value="" className="bg-neutral-900 text-white">Default / Unspecified</option>
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id} className="bg-neutral-900 text-white">
                    {pm.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Consumer ID, Account details"
              className="w-full px-3 py-2 min-h-[38px] bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors text-xs"
            />
          </div>

          {/* Save to master template checkbox */}
          <div className="pt-2 border-t border-neutral-800">
            <label className="flex items-start gap-2 cursor-pointer text-xs text-neutral-300 group py-1">
              <input
                type="checkbox"
                checked={saveToTemplate}
                onChange={(e) => setSaveToTemplate(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-neutral-700 bg-neutral-950 text-white focus:ring-0 focus:ring-offset-0"
              />
              <div>
                <span className="font-medium text-white transition-colors">
                  Also save to Master Template
                </span>
                <p className="text-[11px] text-neutral-400">
                  Automatically include this recurring bill in future months.
                </p>
              </div>
            </label>
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
              <Plus size={14} />
              {isSubmitting ? 'Adding...' : 'Add Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
