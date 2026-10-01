'use client';

import { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Pencil, 
  Check, 
  RotateCcw, 
  Layers,
  CheckCircle2
} from 'lucide-react';
import { MonthlyExpenseTemplate, PaymentMethod } from './types';
import { EXPENSE_CATEGORIES } from './AddEntryModal';
import toast from 'react-hot-toast';

interface TemplateManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: MonthlyExpenseTemplate[];
  paymentMethods: PaymentMethod[];
  activeMonth: string;
  onUpdateTemplates: () => void;
  onSyncToActiveMonth: () => Promise<void>;
}

export default function TemplateManagerModal({
  isOpen,
  onClose,
  templates,
  paymentMethods,
  activeMonth,
  onUpdateTemplates,
  onSyncToActiveMonth,
}: TemplateManagerModalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('OPERATIONAL');
  const [defaultAmount, setDefaultAmount] = useState('');
  const [dueDay, setDueDay] = useState('5');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  const startEdit = (tpl: MonthlyExpenseTemplate) => {
    setEditingId(tpl.id);
    setName(tpl.name);
    setCategory(tpl.category);
    setDefaultAmount(tpl.defaultAmount);
    setDueDay(tpl.dueDay);
    setPaymentMethodId(tpl.paymentMethodId || '');
    setNotes(tpl.notes || '');
    setIsAdding(false);
  };

  const startAdd = () => {
    setEditingId(null);
    setName('');
    setCategory('OPERATIONAL');
    setDefaultAmount('');
    setDueDay('5');
    setPaymentMethodId('');
    setNotes('');
    setIsAdding(true);
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      if (editingId) {
        // Edit existing
        const res = await fetch(`/api/monthly-expenses/templates/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            category,
            defaultAmount: defaultAmount || '0',
            dueDay,
            paymentMethodId,
            notes: notes.trim(),
          }),
        });
        if (!res.ok) throw new Error('Failed to update template');
        toast.success('Template item updated');
      } else {
        // Create new
        const res = await fetch('/api/monthly-expenses/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            category,
            defaultAmount: defaultAmount || '0',
            dueDay,
            paymentMethodId,
            notes: notes.trim(),
          }),
        });
        if (!res.ok) throw new Error('Failed to create template');
        toast.success('Template item added');
      }
      cancelForm();
      onUpdateTemplates();
    } catch {
      toast.error('Failed to save template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete template item "${name}"?`)) return;
    try {
      const res = await fetch(`/api/monthly-expenses/templates/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete template item');
      toast.success('Template item deleted');
      onUpdateTemplates();
    } catch {
      toast.error('Failed to delete template item');
    }
  };

  const handleToggleActive = async (tpl: MonthlyExpenseTemplate) => {
    const newActive = tpl.isActive === 'true' ? 'false' : 'true';
    try {
      const res = await fetch(`/api/monthly-expenses/templates/${tpl.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newActive }),
      });
      if (!res.ok) throw new Error('Failed to update template');
      onUpdateTemplates();
      toast.success(newActive === 'true' ? 'Enabled for upcoming months' : 'Disabled for upcoming months');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await onSyncToActiveMonth();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-white/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/5 text-neutral-400 border border-white/10 shrink-0">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Master Monthly Templates</h3>
              <p className="text-xs text-neutral-400">
                These recurring items automatically populate when every new month unlocks.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Top action bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <button
              onClick={startAdd}
              className="px-4 h-11 min-h-[44px] text-xs font-semibold text-black bg-white hover:bg-neutral-200 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus size={15} /> Add Recurring Bill
            </button>

            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="px-4 h-11 min-h-[44px] text-xs font-medium text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              title={`Add any missing template items to ${activeMonth}`}
            >
              <RotateCcw size={14} className={isSyncing ? 'animate-spin text-white' : ''} />
              {isSyncing ? 'Syncing...' : `Sync missing to ${activeMonth}`}
            </button>
          </div>

          {/* Form when adding or editing */}
          {(isAdding || editingId) && (
            <form onSubmit={handleSave} className="bg-neutral-950/80 border border-white/20 rounded-xl p-4 space-y-3 animate-in fade-in duration-150">
              <div className="text-xs font-semibold text-white">
                {editingId ? 'Edit Recurring Template Item' : 'Create New Recurring Bill Template'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                    Bill / Expense Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Shop Rent, EB Bill, Wi-Fi"
                    className="w-full px-3.5 py-2.5 min-h-[44px] bg-neutral-900 border border-white/10 rounded-xl text-white text-base md:text-xs focus:outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                    Default Expected Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={defaultAmount}
                    onChange={(e) => setDefaultAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 min-h-[44px] bg-neutral-900 border border-white/10 rounded-xl text-white text-base md:text-xs font-mono focus:outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                    Due Day of Month (1 - 31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    placeholder="5"
                    className="w-full px-3.5 py-2.5 min-h-[44px] bg-neutral-900 border border-white/10 rounded-xl text-white text-base md:text-xs font-mono focus:outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 min-h-[44px] bg-neutral-900 border border-white/10 rounded-xl text-white text-base md:text-xs focus:outline-none focus:border-white/30"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value} className="bg-[#121212] text-white">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                    Default Payment Method
                  </label>
                  <select
                    value={paymentMethodId}
                    onChange={(e) => setPaymentMethodId(e.target.value)}
                    className="w-full px-3.5 py-2.5 min-h-[44px] bg-neutral-900 border border-white/10 rounded-xl text-white text-base md:text-xs focus:outline-none focus:border-white/30"
                  >
                    <option value="" className="bg-[#121212] text-white">Unspecified</option>
                    {paymentMethods.map((pm) => (
                      <option key={pm.id} value={pm.id} className="bg-[#121212] text-white">
                        {pm.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                    Notes / Description
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Account number, vendor info"
                    className="w-full px-3.5 py-2.5 min-h-[44px] bg-neutral-900 border border-white/10 rounded-xl text-white text-base md:text-xs focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-4 h-11 min-h-[44px] text-xs text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 h-11 min-h-[44px] text-xs font-semibold text-black bg-white hover:bg-neutral-200 rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <Check size={14} />
                  {isSubmitting ? 'Saving...' : 'Save Template Item'}
                </button>
              </div>
            </form>
          )}

          {/* List of Templates */}
          <div className="space-y-2">
            {templates.map((tpl) => {
              const isActive = tpl.isActive === 'true';
              return (
                <div
                  key={tpl.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-white/5 border-white/10 hover:border-white/20'
                      : 'bg-neutral-950/40 border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <button
                      onClick={() => handleToggleActive(tpl)}
                      className={`w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg border transition-colors shrink-0 ${
                        isActive
                          ? 'bg-white text-black border-white shadow-sm'
                          : 'bg-white/5 border-white/10 text-neutral-500'
                      }`}
                      title={isActive ? 'Active: will auto-populate upcoming months' : 'Inactive'}
                    >
                      <CheckCircle2 size={16} />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white truncate">
                          {tpl.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-400 font-medium">
                          Due day: {tpl.dueDay}th
                        </span>
                      </div>
                      <div className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="font-mono text-white">
                          ₹{Number(tpl.defaultAmount || 0).toLocaleString('en-IN')}
                        </span>
                        <span>•</span>
                        <span className="text-[11px] text-neutral-400">{tpl.category}</span>
                        {tpl.notes && (
                          <>
                            <span>•</span>
                            <span className="text-[11px] text-neutral-400 truncate max-w-[200px]">
                              {tpl.notes}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
                    <button
                      onClick={() => startEdit(tpl)}
                      className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                      title="Edit template"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(tpl.id, tpl.name)}
                      className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                      title="Delete template"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-t border-white/10 bg-white/5 shrink-0">
          <span className="text-xs text-neutral-500">
            {templates.filter((t) => t.isActive === 'true').length} of {templates.length} active templates
          </span>
          <button
            onClick={onClose}
            className="px-5 h-11 min-h-[44px] text-xs font-semibold text-black bg-white hover:bg-neutral-200 rounded-xl transition-all shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
