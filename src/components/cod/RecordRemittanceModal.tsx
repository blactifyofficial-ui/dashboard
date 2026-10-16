'use client';

import { useState } from 'react';
import { X, CheckCircle2, HandCoins } from 'lucide-react';
import { CodRemittanceRecord, PaymentMethodOption } from './types';
import toast from 'react-hot-toast';

interface RecordRemittanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  remittanceToEdit?: CodRemittanceRecord | null;
  paymentMethods: PaymentMethodOption[];
  availableCouriers: string[];
  onSuccess: () => void;
}

export default function RecordRemittanceModal({
  isOpen,
  onClose,
  remittanceToEdit,
  paymentMethods,
  availableCouriers,
  onSuccess,
}: RecordRemittanceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-card border border-border rounded-xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative text-foreground animate-in fade-in zoom-in-95 duration-150">
        <RecordRemittanceForm
          remittanceToEdit={remittanceToEdit}
          paymentMethods={paymentMethods}
          availableCouriers={availableCouriers}
          onSuccess={onSuccess}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

function RecordRemittanceForm({
  remittanceToEdit,
  paymentMethods,
  availableCouriers,
  onSuccess,
  onClose,
}: {
  remittanceToEdit?: CodRemittanceRecord | null;
  paymentMethods: PaymentMethodOption[];
  availableCouriers: string[];
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  const initialAmount = remittanceToEdit?.amount ? parseFloat(remittanceToEdit.amount).toString() : '';
  const initialDate = remittanceToEdit?.receivedDate
    ? new Date(remittanceToEdit.receivedDate).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const [amount, setAmount] = useState<string>(initialAmount);
  const [receivedDate, setReceivedDate] = useState<string>(initialDate);
  const [courier, setCourier] = useState<string>(remittanceToEdit?.courier || 'India Post Domestic');
  const [customCourier, setCustomCourier] = useState<string>('');
  const [isCustomCourier, setIsCustomCourier] = useState<boolean>(false);
  const [paymentMethodId, setPaymentMethodId] = useState<string>(remittanceToEdit?.paymentMethodId || '');
  const [referenceNumber, setReferenceNumber] = useState<string>(remittanceToEdit?.referenceNumber || '');
  const [ordersCount, setOrdersCount] = useState<string>(remittanceToEdit?.ordersCount || '');
  const [notes, setNotes] = useState<string>(remittanceToEdit?.notes || '');

  // Common couriers list
  const standardCouriers = ['India Post Domestic', 'Delhivery', 'Blue Dart', 'DTDC', 'Shadowfax', 'Ecom Express', 'Cash in Hand', 'Other'];
  const allCouriers = Array.from(new Set([...standardCouriers, ...availableCouriers])).filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      toast.error('Please enter a valid amount received');
      return;
    }

    const effectiveCourier = isCustomCourier ? customCourier.trim() : courier;

    try {
      setSubmitting(true);
      const isEditing = Boolean(remittanceToEdit?.id);
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch('/api/cod', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: remittanceToEdit?.id,
          amount: amtNum,
          receivedDate,
          courier: effectiveCourier || null,
          paymentMethodId: paymentMethodId || null,
          referenceNumber: referenceNumber.trim() || null,
          ordersCount: ordersCount ? parseInt(ordersCount, 10) : null,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save COD remittance');
      }

      toast.success(
        isEditing
          ? 'COD payment record updated!'
          : `Recorded ₹${amtNum.toLocaleString('en-IN')} COD collection!`
      );
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
            <HandCoins size={18} className="text-amber-400" />
            {remittanceToEdit ? 'Edit COD Payment Entry' : 'Record COD Payment Received'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Record lump-sum cash/bank remittance received from courier or post office
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Amount Received (Large Hero Input) */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            Amount Received (₹) <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-base sm:text-lg">
              ₹
            </span>
            <input
              type="number"
              step="0.01"
              required
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 15000"
              className="w-full pl-8 pr-4 py-2.5 text-base sm:text-lg font-mono font-bold bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:border-ring transition-colors"
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Enter the exact lump-sum amount credited to your bank account or received in cash.
          </p>
        </div>

        {/* Date and Courier */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Date Received <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              required
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-background border border-border rounded-lg text-foreground font-mono focus:outline-hidden focus:border-ring transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Courier / Payout Source
            </label>
            {!isCustomCourier ? (
              <select
                value={courier}
                onChange={(e) => {
                  if (e.target.value === 'Other') {
                    setIsCustomCourier(true);
                  } else {
                    setCourier(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-background border border-border rounded-lg text-foreground focus:outline-hidden focus:border-ring transition-colors cursor-pointer"
              >
                {allCouriers.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Enter courier name"
                  value={customCourier}
                  onChange={(e) => setCustomCourier(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-background border border-border rounded-lg text-foreground focus:outline-hidden focus:border-ring transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setIsCustomCourier(false)}
                  className="px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  List
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Deposited in Account and Number of Orders Covered */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Deposited In / Payment Method
            </label>
            <select
              value={paymentMethodId}
              onChange={(e) => setPaymentMethodId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-background border border-border rounded-lg text-foreground focus:outline-hidden focus:border-ring transition-colors cursor-pointer"
            >
              <option value="">Select bank / account (optional)...</option>
              {paymentMethods.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Parcels / Orders Covered
            </label>
            <input
              type="number"
              min="1"
              value={ordersCount}
              onChange={(e) => setOrdersCount(e.target.value)}
              placeholder="e.g. 5 or 6 parcels"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:border-ring transition-colors font-mono"
            />
          </div>
        </div>

        {/* Reference Number / UTR */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            Remittance Reference / UTR / Cheque # (Optional)
          </label>
          <input
            type="text"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="e.g. UTR-98218732 or India Post Slip #491"
            className="w-full px-3 py-2 text-xs sm:text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:border-ring transition-colors font-mono"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            Notes / Batch Remarks (Optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Received for 6 packages delivered last weekend, post office deduction ₹50..."
            className="w-full px-3 py-2 text-xs sm:text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:border-ring transition-colors"
          />
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground bg-secondary hover:bg-muted rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <CheckCircle2 size={14} />
            {submitting ? 'Saving...' : remittanceToEdit ? 'Update Entry' : 'Record Payment'}
          </button>
        </div>
      </form>
    </div>
  );
}
