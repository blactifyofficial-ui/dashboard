"use client";

import * as React from "react";
import { Flame, CheckCircle2, AlertCircle, PiggyBank, Plus, Edit3 } from "lucide-react";
import { DailySavingEntry, PaymentMethodOption } from "./types";

interface DailySavingsHeroProps {
  todayEntry: DailySavingEntry | null;
  currentStreak: number;
  bestStreak: number;
  paymentMethods: PaymentMethodOption[];
  onOpenMarkModal: (date?: string, entry?: DailySavingEntry | null) => void;
}

export function DailySavingsHero({
  todayEntry,
  currentStreak,
  bestStreak,
  onOpenMarkModal,
}: DailySavingsHeroProps) {
  const isSavedToday = Boolean(todayEntry && Number(todayEntry.amount) > 0);
  const savedAmount = todayEntry ? Number(todayEntry.amount) : 0;

  // Format today's date nicely: "Tuesday, 10 Nov 2026"
  const formattedToday = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-emerald-500/5 p-6 md:p-8 shadow-sm">
      {/* Background ambient glow */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-32 -bottom-16 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Today's Status & Streak */}
        <div className="space-y-3 max-w-xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {formattedToday}
            </span>

            {/* Streak Counter Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-bounce" />
              <span>{currentStreak} Day{currentStreak === 1 ? "" : "s"} Streak</span>
              {bestStreak > 0 && (
                <span className="text-muted-foreground text-[10px] font-normal border-l border-amber-500/30 pl-1.5 ml-0.5">
                  Best: {bestStreak}d
                </span>
              )}
            </div>
          </div>

          <div>
            {isSavedToday ? (
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                  <span>🎉 Today&apos;s Saving Logged:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ₹{savedAmount.toLocaleString("en-IN")}
                  </span>
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Great job! You logged your daily savings today.
                  {todayEntry?.note && <span className="italic font-normal">(&quot;{todayEntry.note}&quot;)</span>}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                  How much did you save today?
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Keep your habit strong! Mark today&apos;s saving to continue your streak.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Action Button & Preset Pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {isSavedToday ? (
            <button
              onClick={() => onOpenMarkModal(todayEntry?.date, todayEntry)}
              className="px-5 py-3 rounded-2xl border border-border bg-card hover:bg-muted/60 text-foreground font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Edit3 className="w-4 h-4 text-muted-foreground" />
              <span>Edit Today&apos;s Saving</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenMarkModal()}
              className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <PiggyBank className="w-5 h-5" />
              <span>Mark Today&apos;s Saving</span>
            </button>
          )}

          <button
            onClick={() => onOpenMarkModal()}
            className="px-4 py-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold text-sm flex items-center justify-center gap-1.5 transition"
            title="Log saving for another date"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Backfill</span>
          </button>
        </div>
      </div>
    </div>
  );
}

