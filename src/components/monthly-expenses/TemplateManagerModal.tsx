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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-muted text-foreground border border-border shrink-0">
              <Layers size={16} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-foreground">Master Monthly Templates</h3>
              <p className="text-xs text-muted-foreground">
                These recurring items automatically populate when every new month unlocks.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg bg-muted hover:bg-muted/80 transition-colors shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Top action bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <button
              onClick={startAdd}
              className="px-3.5 py-2 min-h-[38px] text-xs font-semibold text-primary-foreground bg-primary hover:opacity-90 rounded-lg transition-opacity flex items-center justify-center gap-1.5"
            >
              <Plus size={14} /> Add Recurring Bill
            </button>

            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="px-3.5 py-2 min-h-[38px] text-xs font-medium text-foreground bg-muted hover:bg-muted/80 border border-border rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              title={`Add any missing template items to ${activeMonth}`}
            >
              <RotateCcw size={13} className={isSyncing ? 'animate-spin text-foreground' : ''} />
              {isSyncing ? 'Syncing...' : `Sync missing to ${activeMonth}`}
            </button>
          </div>

          {/* Form when adding or editing */}
          {(isAdding || editingId) && (
            <form onSubmit={handleSave} className="bg-background border border-border rounded-lg p-3.5 space-y-3">
              <div className="text-xs font-semibold text-foreground">
                {editingId ? 'Edit Recurring Template Item' : 'Create New Recurring Bill Template'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Bill / Expense Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Shop Rent, EB Bill, Wi-Fi"
                    className="w-full px-3 py-2 min-h-[38px] bg-background border border-border rounded-lg text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Default Expected Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={defaultAmount}
                    onChange={(e) => setDefaultAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 min-h-[38px] bg-background border border-border rounded-lg text-foreground text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Due Day of Month (1 - 31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    placeholder="5"
                    className="w-full px-3 py-2 min-h-[38px] bg-background border border-border rounded-lg text-foreground text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 min-h-[38px] bg-background border border-border rounded-lg text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value} className="bg-popover text-popover-foreground">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Default Payment Method
                  </label>
                  <select
                    value={paymentMethodId}
                    onChange={(e) => setPaymentMethodId(e.target.value)}
                    className="w-full px-3 py-2 min-h-[38px] bg-background border border-border rounded-lg text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="" className="bg-popover text-popover-foreground">Unspecified</option>
                    {paymentMethods.map((pm) => (
                      <option key={pm.id} value={pm.id} className="bg-popover text-popover-foreground">
                        {pm.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Notes / Description
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Account number, vendor info"
                    className="w-full px-3 py-2 min-h-[38px] bg-background border border-border rounded-lg text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-3.5 py-1.5 min-h-[36px] text-xs text-muted-foreground hover:text-foreground rounded-lg bg-muted hover:bg-muted/80 border border-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 min-h-[36px] text-xs font-semibold text-primary-foreground bg-primary hover:opacity-90 rounded-lg flex items-center gap-1.5"
                >
                  <Check size={13} />
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
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
                    isActive
                      ? 'bg-card border-border shadow-xs'
                      : 'bg-muted/30 border-border/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => handleToggleActive(tpl)}
                      className={`w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg border transition-colors shrink-0 ${
                        isActive
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted border-border text-muted-foreground'
                      }`}
                      title={isActive ? 'Active: will auto-populate upcoming months' : 'Inactive'}
                    >
                      <CheckCircle2 size={15} />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                          {tpl.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium border border-border">
                          Due day: {tpl.dueDay}th
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="font-mono text-foreground font-medium">
                          ₹{Number(tpl.defaultAmount || 0).toLocaleString('en-IN')}
                        </span>
                        <span>•</span>
                        <span className="text-[11px] text-muted-foreground">{tpl.category}</span>
                        {tpl.notes && (
                          <>
                            <span>•</span>
                            <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
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
                      className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg bg-muted hover:bg-muted/80 border border-border transition-colors"
                      title="Edit template"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(tpl.id, tpl.name)}
                      className="w-8 h-8 flex items-center justify-center text-rose-600 dark:text-rose-300 hover:text-rose-700 dark:hover:text-rose-200 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
                      title="Delete template"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-border bg-muted/20 shrink-0">
          <span className="text-xs text-muted-foreground">
            {templates.filter((t) => t.isActive === 'true').length} of {templates.length} active templates
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 min-h-[38px] text-xs font-semibold text-primary-foreground bg-primary hover:opacity-90 rounded-lg transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
