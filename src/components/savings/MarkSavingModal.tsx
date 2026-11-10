"use client";

import * as React from "react";
import { X, Check, PiggyBank, Calendar, Wallet } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  DailySavingEntry,
  PaymentMethodOption,
  SAVINGS_DESTINATIONS,
  SavingsDestination,
} from "./types";

interface MarkSavingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDate?: string;
  existingEntry?: DailySavingEntry | null;
  paymentMethods: PaymentMethodOption[];
  dailyTarget?: number;
}

const PRESET_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export function MarkSavingModal(props: MarkSavingModalProps) {
  if (!props.isOpen) return null;
  return (
    <MarkSavingModalContent
      key={props.existingEntry?.id ?? props.defaultDate ?? "new"}
      {...props}
    />
  );
}

function MarkSavingModalContent({
  onClose,
  onSuccess,
  defaultDate,
  existingEntry,
  paymentMethods,
  dailyTarget = 500,
}: MarkSavingModalProps) {
  const [date, setDate] = React.useState<string>(
    existingEntry ? existingEntry.date : (defaultDate || new Date().toISOString().split("T")[0])
  );
  const [amount, setAmount] = React.useState<string>(
    existingEntry ? String(existingEntry.amount || "") : (dailyTarget > 0 ? String(dailyTarget) : "500")
  );
  const [destination, setDestination] = React.useState<SavingsDestination>(
    existingEntry?.destination || "BANK_ACCOUNT"
  );
  const [paymentMethodId, setPaymentMethodId] = React.useState<string>(
    existingEntry?.paymentMethodId || paymentMethods[0]?.id || ""
  );
  const [note, setNote] = React.useState<string>(existingEntry?.note || "");
  const [mirrorToExpenses, setMirrorToExpenses] = React.useState<boolean>(
    Boolean(existingEntry?.expenseId)
  );
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Please enter a valid savings amount greater than 0");
      return;
    }

    try {
      setIsSubmitting(true);

      if (existingEntry) {
        // Update existing entry
        const res = await fetch(`/api/savings/${existingEntry.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: numAmount,
            destination,
            paymentMethodId: paymentMethodId || null,
            note: note.trim() || null,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to update daily saving");
        }

        toast.success(`Updated saving for ${date}: ₹${numAmount.toLocaleString("en-IN")}`);
      } else {
        // Create new entry
        const res = await fetch("/api/savings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            amount: numAmount,
            destination,
            paymentMethodId: paymentMethodId || null,
            note: note.trim() || null,
            mirrorToExpenses,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to record daily saving");
        }

        toast.success(`🎉 Saved ₹${numAmount.toLocaleString("en-IN")} on ${date}!`);
      }

      onSuccess();
      onClose();
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error("Save error:", err);
      toast.error(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">
                {existingEntry ? "Edit Daily Saving" : "Mark Daily Saving"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {existingEntry
                  ? `Update saving details for ${date}`
                  : "Put money aside and build your daily wealth habit"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                disabled={Boolean(existingEntry)}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 disabled:opacity-60 transition"
              />
              <Calendar className="w-4 h-4 text-muted-foreground absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Amount & Quick Preset Chips */}
          <div>
            <div className="mb-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Saved Amount (₹)
              </label>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-lg font-bold text-muted-foreground">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="1"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xl font-bold tracking-tight focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
              />
            </div>

            {/* Preset Amount Chips */}
            <div className="flex flex-wrap gap-2 mt-2.5">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition ${
                    Number(amount) === preset
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40"
                      : "bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                  }`}
                >
                  ₹{preset >= 1000 ? `${preset / 1000}k` : preset}
                </button>
              ))}
            </div>
          </div>

          {/* Destination Vault / Bucket */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Destination Stash / Account
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SAVINGS_DESTINATIONS.map((dest) => {
                const isSelected = destination === dest.value;
                return (
                  <button
                    key={dest.value}
                    type="button"
                    onClick={() => setDestination(dest.value)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-medium transition ${
                      isSelected
                        ? "bg-emerald-500/10 border-emerald-500/40 text-foreground ring-1 ring-emerald-500/30"
                        : "bg-background border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    <span className="text-base">{dest.icon}</span>
                    <span className="truncate">{dest.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment / Transfer Method */}
          {paymentMethods.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Origin / Payment Method (Optional)
              </label>
              <div className="relative">
                <select
                  value={paymentMethodId}
                  onChange={(e) => setPaymentMethodId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                >
                  <option value="">-- No specific method --</option>
                  {paymentMethods.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.name}
                    </option>
                  ))}
                </select>
                <Wallet className="w-4 h-4 text-muted-foreground absolute right-3.5 top-3 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Note / Memo */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Note / Context (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Skipped takeout dining, extra order profit, round-up"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
            />
          </div>

          {/* Mirror to Expenses Checkbox (Only for new entries or if not already mirrored) */}
          {!existingEntry && (
            <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/20 cursor-pointer hover:bg-muted/30 transition">
              <input
                type="checkbox"
                checked={mirrorToExpenses}
                onChange={(e) => setMirrorToExpenses(e.target.checked)}
                className="mt-0.5 rounded border-border text-emerald-600 focus:ring-emerald-500"
              />
              <div className="text-xs">
                <span className="font-semibold text-foreground">
                  Record as expense in Cashflow
                </span>
                <p className="text-muted-foreground mt-0.5">
                  Deducts this amount from daily operational expenses under category &quot;Savings & Reserves&quot;.
                </p>
              </div>
            </label>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition disabled:opacity-60"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {existingEntry ? "Update Saving" : "Save Today's Amount"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
