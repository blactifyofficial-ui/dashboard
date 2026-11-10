"use client";

import * as React from "react";
import { PiggyBank, Flame, CalendarDays, Wallet } from "lucide-react";
import { SavingsSummary } from "./types";

interface SavingsSummaryCardsProps {
  summary: SavingsSummary;
}

export function SavingsSummaryCards({ summary }: SavingsSummaryCardsProps) {
  const {
    totalSaved,
    monthlyTarget,
    daysSaved,
    daysInMonth,
    completionRate,
    currentStreak,
    bestStreak,
    averageDaily,
    destinations,
  } = summary;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Saved This Month */}
      <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Month Savings
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black tracking-tight text-foreground">
            ₹{totalSaved.toLocaleString("en-IN")}
          </div>
          <div className="mt-2.5">
            <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground mb-1">
              <span>Goal: ₹{monthlyTarget.toLocaleString("en-IN")}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{completionRate}%</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, completionRate)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Habit Streak */}
      <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Daily Habit Streak
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Flame className="w-4 h-4 fill-amber-500/20" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-foreground">
              {currentStreak}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              Day{currentStreak === 1 ? "" : "s"} In A Row 🔥
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center justify-between">
            <span>All-time Best:</span>
            <span className="font-semibold text-foreground">{bestStreak} Days</span>
          </p>
        </div>
      </div>

      {/* 3. Consistency & Average */}
      <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Consistency
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <CalendarDays className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tight text-foreground">
              {daysSaved}
            </span>
            <span className="text-sm text-muted-foreground">/ {daysInMonth} Days Active</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center justify-between">
            <span>Avg Saved / Day:</span>
            <span className="font-semibold text-foreground">₹{averageDaily.toLocaleString("en-IN")}</span>
          </p>
        </div>
      </div>

      {/* 4. Vault & Stash Allocation */}
      <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Reserve Breakdown
          </span>
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">🏦 Bank:</span>
            <span className="font-semibold text-foreground">₹{(destinations.BANK_ACCOUNT || 0).toLocaleString("en-IN")}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">💵 Cash:</span>
            <span className="font-semibold text-foreground">₹{(destinations.CASH || 0).toLocaleString("en-IN")}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">🛡️ Emergency:</span>
            <span className="font-semibold text-foreground">₹{(destinations.EMERGENCY_FUND || 0).toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

