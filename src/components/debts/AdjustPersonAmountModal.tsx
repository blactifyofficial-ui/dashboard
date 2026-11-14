'use client';

import { useState, useMemo } from 'react';
import { Debt, DebtContact, DebtType, PaymentMethod } from './types';
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
  Sliders,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AdjustPersonAmountModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contact: DebtContact | null;
  debts: Debt[];
  paymentMethods: PaymentMethod[];
}

export default function AdjustPersonAmountModal(props: AdjustPersonAmountModalProps) {
  if (!props.open || !props.contact) return null;
  return <AdjustPersonAmountModalContent key={props.contact.id} {...props} contact={props.contact} />;
}

function AdjustPersonAmountModalContent({
  onClose,
  onSuccess,
  contact,
  debts,
  paymentMethods,
}: AdjustPersonAmountModalProps & { contact: DebtContact }) {
  // Determine available types with balances
  const initialType: DebtType =
    (contact.activeLent || 0) > 0
      ? 'LENT'
      : (contact.activeBorrowed || 0) > 0
        ? 'BORROWED'
        : 'LENT';

  const [selectedType, setSelectedType] = useState<DebtType>(initialType);

  // Filter open debts for this contact and type
  const openDebts = useMemo(() => {
    const contactNameLower = contact.name.trim().toLowerCase();
    return debts.filter((d) => {
      const matchContact =
        (d.contactId && d.contactId === contact.id) ||
        (d.contactName && d.contactName.trim().toLowerCase() === contactNameLower);

      const isActive =
        d.status !== 'SETTLED' &&
        d.status !== 'CANCELLED' &&
        Number(d.remainingAmount) > 0.001;

      return matchContact && d.type === selectedType && isActive;
    });
  }, [debts, contact, selectedType]);

  const totalOutstanding = useMemo(() => {
    return openDebts.reduce((sum, d) => sum + (Number(d.remainingAmount) || 0), 0);
  }, [openDebts]);

  const [selectedDebtId, setSelectedDebtId] = useState<string>('ALL');
  const targetDebt = openDebts.find((d) => d.id === selectedDebtId) || null;
  const activeRemaining = targetDebt ? Number(targetDebt.remainingAmount) : totalOutstanding;

  const [amount, setAmount] = useState<string>(
    activeRemaining > 0 ? activeRemaining.toFixed(2) : ''
  );
  const [settlementDate, setSettlementDate] = useState<string>(formatInputDate(new Date()));
  const [paymentMethodId, setPaymentMethodId] = useState<string>(paymentMethods[0]?.id || '');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [recordAsExpense, setRecordAsExpense] = useState<boolean>(selectedType === 'BORROWED');
  const [saving, setSaving] = useState(false);

  // Update amount preset
  const handlePresetClick = (fraction: number) => {
    if (activeRemaining <= 0) return;
    const calculated = (activeRemaining * fraction).toFixed(2);
    setAmount(calculated);
  };

  const parsedAmount = Number(amount) || 0;
  const resultingRemaining = Math.max(0, activeRemaining - parsedAmount);
  const willBeFullySettled = resultingRemaining <= 0.001 && parsedAmount > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parsedAmount <= 0) {
      toast.error('Please enter a valid settlement amount greater than 0');
      return;
    }

    if (parsedAmount > activeRemaining + 0.01) {
      toast.error(`Amount cannot exceed the balance of ${formatCurrency(activeRemaining)}`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/debts/contacts/${contact.id}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parsedAmount,
          type: selectedType,
          debtId: selectedDebtId === 'ALL' ? undefined : selectedDebtId,
          settlementDate,
          paymentMethodId: paymentMethodId || null,
          referenceNumber: referenceNumber.trim() || null,
          notes: notes.trim() || null,
          recordAsExpense,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to adjust amount');

      toast.success(
        willBeFullySettled
          ? `Balance fully settled for ${contact.name}!`
          : `Payment of ${formatCurrency(parsedAmount)} adjusted for ${contact.name}!`
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-popover border border-border rounded-[20px] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Adjust Amount &bull; {contact.name}
              </h2>
              <p className="text-xs text-muted-foreground">
                Record a full, 1/3, half, or partial payment to adjust their total balance.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-full hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Type Switcher (if both Lent & Borrowed exist or for selection) */}
        <div className="px-5 pt-4">
          <div className="grid grid-cols-2 p-1 rounded-xl bg-muted/60 border border-border gap-1">
            <button
              type="button"
              onClick={() => {
                setSelectedType('LENT');
                setRecordAsExpense(false);
                setSelectedDebtId('ALL');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${selectedType === 'LENT'
                  ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Lent Recovery</span>
              {(contact.activeLent || 0) > 0 && (
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  {formatCurrency(contact.activeLent)}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedType('BORROWED');
                setRecordAsExpense(true);
                setSelectedDebtId('ALL');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${selectedType === 'BORROWED'
                  ? 'bg-card text-amber-600 dark:text-amber-400 shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Borrowed Repay</span>
              {(contact.activeBorrowed || 0) > 0 && (
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  {formatCurrency(contact.activeBorrowed)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Balance Card & Calculation Preview */}
        <div className="px-5 pt-3">
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Current Total Outstanding</span>
              <span className="font-mono font-bold text-sm text-foreground">
                {formatCurrency(activeRemaining)}
              </span>
            </div>

            {/* If multiple debts, allow target selection */}
            {openDebts.length > 1 && (
              <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground font-medium shrink-0">
                  Apply Payment To:
                </span>
                <select
                  value={selectedDebtId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedDebtId(nextId);
                    const debtObj = openDebts.find((d) => d.id === nextId);
                    const bal = debtObj ? Number(debtObj.remainingAmount) : totalOutstanding;
                    setAmount(bal > 0 ? bal.toFixed(2) : '');
                  }}
                  className="h-7 text-[11px] bg-card border border-border rounded-lg text-foreground px-2 focus:outline-none"
                >
                  <option value="ALL">Auto (Oldest Debt First &bull; FIFO)</option>
                  {openDebts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.category} &bull; {formatCurrency(d.remainingAmount)} remaining
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Dynamic Resulting Balance */}
            <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">New Remaining Balance:</span>
              <span
                className={`font-mono font-bold text-sm ${willBeFullySettled
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-foreground'
                  }`}
              >
                {formatCurrency(resultingRemaining)}
              </span>
            </div>
          </div>
        </div>

        {/* If no active debts */}
        {activeRemaining <= 0.001 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">No Outstanding {selectedType} Balance</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {contact.name} is fully settled on {selectedType.toLowerCase()} debts.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-8 px-4 text-xs rounded-full border-border bg-card"
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Quick Presets (100%, 50%, 1/3rd, 25%) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Quick Adjust Presets
              </label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handlePresetClick(1.0)}
                  className="py-1.5 px-1 text-xs font-semibold rounded-full bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors text-center"
                >
                  100% (Full)
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetClick(0.5)}
                  className="py-1.5 px-1 text-xs font-semibold rounded-full bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors text-center"
                >
                  50% (1/2)
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetClick(1 / 3)}
                  className="py-1.5 px-1 text-xs font-semibold rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-colors text-center font-bold"
                  title="Pay 1/3 of total"
                >
                  33% (1/3)
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetClick(0.25)}
                  className="py-1.5 px-1 text-xs font-semibold rounded-full bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors text-center"
                >
                  25% (1/4)
                </button>
              </div>
            </div>

            {/* Custom Payment Amount Input */}
            <div>
              <label className="text-xs font-medium text-foreground mb-1 flex items-center justify-between">
                <span>Payment / Adjustment Amount (₹) <span className="text-rose-500">*</span></span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  Max: {formatCurrency(activeRemaining)}
                </span>
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={activeRemaining}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter custom amount"
                className="h-10 text-sm font-mono font-bold bg-card border-border text-emerald-600 dark:text-emerald-400"
                required
                autoFocus
              />
              {willBeFullySettled && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  This payment will mark this balance as 100% settled.
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
                  value={settlementDate}
                  onChange={(e) => setSettlementDate(e.target.value)}
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
                  value={paymentMethodId}
                  onChange={(e) => setPaymentMethodId(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  {paymentMethods.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reference Number & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  Reference / UTR (Optional)
                </label>
                <Input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. UPI Ref / Txn ID"
                  className="h-10 text-xs bg-card border-border text-foreground"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">
                  Notes (Optional)
                </label>
                <Input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Paid 1/3 installment"
                  className="h-10 text-xs bg-card border-border text-foreground"
                />
              </div>
            </div>

            {/* Expense Sync Toggle */}
            {selectedType === 'BORROWED' && (
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={recordAsExpense}
                    onChange={(e) => setRecordAsExpense(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/40"
                  />
                  <span className="text-xs text-foreground">
                    Record this repayment as a business cash expense
                  </span>
                </label>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={saving}
                className="h-9 px-4 text-xs rounded-full border-border bg-card text-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving || parsedAmount <= 0}
                className="h-9 px-5 text-xs font-semibold rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Adjusting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Confirm &amp; Adjust Total
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
