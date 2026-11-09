'use client';

import { useState } from 'react';
import { Debt, PaymentMethod, SettlementFormData } from './types';
import { formatCurrency, formatInputDate } from './utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  X,
  Loader2,
  CheckCircle2,
  Calendar,
  CreditCard,
  FileText,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface RecordSettlementModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  debt: Debt | null;
  paymentMethods: PaymentMethod[];
}

export default function RecordSettlementModal(props: RecordSettlementModalProps) {
  if (!props.open || !props.debt) return null;
  return <RecordSettlementModalContent key={props.debt.id} {...props} debt={props.debt} />;
}

function RecordSettlementModalContent({
  onClose,
  onSuccess,
  debt,
  paymentMethods,
}: RecordSettlementModalProps & { debt: Debt }) {
  const currentRemaining = Number(debt.remainingAmount) || 0;

  const [formData, setFormData] = useState<SettlementFormData>(() => ({
    amount: currentRemaining > 0 ? currentRemaining.toString() : '',
    settlementDate: formatInputDate(new Date()),
    paymentMethodId: debt.paymentMethodId || paymentMethods[0]?.id || '',
    referenceNumber: '',
    notes: '',
    recordAsExpense: debt.type === 'BORROWED',
  }));

  const [saving, setSaving] = useState(false);

  const settlementAmount = Number(formData.amount) || 0;
  const resultingRemaining = Math.max(0, currentRemaining - settlementAmount);
  const willBeFullySettled = resultingRemaining <= 0.001 && settlementAmount > 0;
  const isLent = debt.type === 'LENT';

  const handlePresetClick = (pct: number) => {
    const calculated = (currentRemaining * pct).toFixed(2);
    setFormData((prev) => ({ ...prev, amount: calculated }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || settlementAmount <= 0) {
      toast.error('Please enter a valid settlement amount greater than 0');
      return;
    }

    if (settlementAmount > currentRemaining + 0.01) {
      toast.error(`Amount cannot exceed the remaining balance of ${formatCurrency(currentRemaining)}`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/debts/${debt.id}/settlements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record settlement');

      toast.success(
        willBeFullySettled
          ? 'Payment recorded and debt marked as fully settled!'
          : 'Settlement installment recorded successfully!'
      );

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-popover border border-border rounded-[18px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {isLent ? 'Record Receipt (Lent Recovery)' : 'Record Repayment (Borrowed Debt)'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Record a full or partial installment for {debt.contactName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-full hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Balance Card */}
        <div className="px-5 pt-4">
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Contact / Party</span>
              <span className="text-xs font-semibold text-foreground">{debt.contactName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Type</span>
              {isLent ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Lent (They Owe You)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  Borrowed (You Owe Them)
                </span>
              )}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-border">
              <span className="text-xs text-muted-foreground font-medium">Remaining Outstanding</span>
              <span className="text-sm font-bold font-mono text-foreground">
                {formatCurrency(currentRemaining)}
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Preset Buttons */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Quick Presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePresetClick(1.0)}
                className="py-1.5 px-2 text-xs font-semibold rounded-full bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors"
              >
                100% (Full)
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick(0.5)}
                className="py-1.5 px-2 text-xs font-semibold rounded-full bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors"
              >
                50% (Half)
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick(0.25)}
                className="py-1.5 px-2 text-xs font-semibold rounded-full bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors"
              >
                25%
              </button>
            </div>
          </div>

          {/* Settlement Amount */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1 flex items-center justify-between">
              <span>Settlement Amount (₹) <span className="text-rose-500">*</span></span>
              {settlementAmount > 0 && (
                <span className="text-[11px] font-mono text-muted-foreground">
                  New Balance: {formatCurrency(resultingRemaining)}
                </span>
              )}
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={currentRemaining}
              value={formData.amount}
              onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
              placeholder="Enter payment amount"
              className="h-10 text-sm font-mono font-bold bg-card border-border text-emerald-600 dark:text-emerald-400"
              required
            />
            {willBeFullySettled && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                This payment will mark this debt as 100% settled.
              </p>
            )}
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Payment Date
              </label>
              <Input
                type="date"
                value={formData.settlementDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, settlementDate: e.target.value }))}
                className="h-10 text-xs bg-card border-border text-foreground"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                Payment Method
              </label>
              <select
                value={formData.paymentMethodId}
                onChange={(e) => setFormData((prev) => ({ ...prev, paymentMethodId: e.target.value }))}
                className="w-full h-10 px-3 text-xs bg-card border border-border rounded-[11px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="" className="bg-card text-foreground">Select Method (Optional)</option>
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id} className="bg-card text-foreground">
                    {pm.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              Settlement Notes
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g. Part payment received via Google Pay"
              className="w-full p-2.5 text-xs bg-card border border-border rounded-[11px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Optional: Record in Expenses */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border border-border">
            <input
              type="checkbox"
              id="settlementRecordExpense"
              checked={formData.recordAsExpense}
              onChange={(e) => setFormData((prev) => ({ ...prev, recordAsExpense: e.target.checked }))}
              className="rounded border-border bg-card text-primary focus:ring-primary h-4 w-4 cursor-pointer"
            />
            <label htmlFor="settlementRecordExpense" className="text-xs text-foreground cursor-pointer font-medium">
              {debt.type === 'BORROWED'
                ? 'Also log this repayment outflow as an entry in Daily Expenses'
                : 'Also log this receipt in Daily Expenses ledger'}
            </label>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="text-xs h-9 px-4 rounded-full border-border text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="text-xs h-9 px-5 font-semibold rounded-full text-white bg-emerald-600 hover:bg-emerald-500"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Recording...
                </>
              ) : (
                'Confirm Settlement'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

