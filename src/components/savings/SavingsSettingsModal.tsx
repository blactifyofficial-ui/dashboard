"use client";

import * as React from "react";
import { X, Check, Settings } from "lucide-react";
import { toast } from "react-hot-toast";
import { DailySavingsSettings } from "./types";

interface SavingsSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentSettings?: DailySavingsSettings | null;
}

export function SavingsSettingsModal(props: SavingsSettingsModalProps) {
  if (!props.isOpen) return null;
  return (
    <SavingsSettingsModalContent
      key={props.currentSettings?.updatedAt ?? "settings_modal"}
      {...props}
    />
  );
}

function SavingsSettingsModalContent({
  onClose,
  onSuccess,
  currentSettings,
}: SavingsSettingsModalProps) {
  const [dailyTarget, setDailyTarget] = React.useState<string>(
    currentSettings?.dailyTarget ? String(currentSettings.dailyTarget) : "500"
  );
  const [monthlyTarget, setMonthlyTarget] = React.useState<string>(
    currentSettings?.monthlyTarget ? String(currentSettings.monthlyTarget) : "15000"
  );
  const [mirrorToExpenses, setMirrorToExpenses] = React.useState<boolean>(
    currentSettings?.mirrorToExpenses === "true"
  );
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numDaily = Number(dailyTarget);
    const numMonthly = Number(monthlyTarget);

    if (numDaily <= 0 || numMonthly <= 0) {
      toast.error("Targets must be positive numbers");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/savings/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyTarget: numDaily,
          monthlyTarget: numMonthly,
          mirrorToExpenses,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update savings settings");
      }

      toast.success("Savings targets and preferences updated!");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error("Settings error:", error);
      toast.error(error.message || "Failed to save settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted text-foreground border border-border flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">Savings Goals & Targets</h3>
              <p className="text-xs text-muted-foreground">Customize your daily streak goals</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Daily Savings Target (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-muted-foreground">₹</span>
              <input
                type="number"
                min="1"
                step="any"
                value={dailyTarget}
                onChange={(e) => setDailyTarget(e.target.value)}
                required
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Minimum daily amount needed to mark a day as fully achieved.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Monthly Savings Goal (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-muted-foreground">₹</span>
              <input
                type="number"
                min="1"
                step="any"
                value={monthlyTarget}
                onChange={(e) => setMonthlyTarget(e.target.value)}
                required
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Total accumulation target for each month.
            </p>
          </div>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/20 cursor-pointer hover:bg-muted/30 transition">
            <input
              type="checkbox"
              checked={mirrorToExpenses}
              onChange={(e) => setMirrorToExpenses(e.target.checked)}
              className="mt-0.5 rounded border-border text-emerald-600 focus:ring-emerald-500"
            />
            <div className="text-xs">
              <span className="font-semibold text-foreground">
                Auto-record as operating expense by default
              </span>
              <p className="text-muted-foreground mt-0.5">
                Automatically logs an expense under &quot;Savings & Reserves&quot; so your operational cash balance reflects the deduction.
              </p>
            </div>
          </label>

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
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
