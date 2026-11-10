"use client";

import * as React from "react";
import { useAuth } from "@/context/AuthContext";
import AccessDenied from "@/components/AccessDenied";
import LoadingSpinner from "@/components/LoadingSpinner";
import { DailySavingsHero } from "@/components/savings/DailySavingsHero";
import { SavingsSummaryCards } from "@/components/savings/SavingsSummaryCards";
import { SavingsCalendarView } from "@/components/savings/SavingsCalendarView";
import { SavingsHistoryTable } from "@/components/savings/SavingsHistoryTable";
import { MarkSavingModal } from "@/components/savings/MarkSavingModal";
import { SavingsSettingsModal } from "@/components/savings/SavingsSettingsModal";
import {
  DailySavingEntry,
  DailySavingsSettings,
  PaymentMethodOption,
  SavingsSummary,
} from "@/components/savings/types";
import { PiggyBank, Settings, RefreshCw, Calendar, ListFilter } from "lucide-react";
import { toast } from "react-hot-toast";

function getCurrentMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export default function SavingsPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission("savings:view");
  const canManage = hasPermission("savings:manage");

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedMonth, setSelectedMonth] = React.useState<string>(getCurrentMonthString());

  // Data states
  const [entries, setEntries] = React.useState<DailySavingEntry[]>([]);
  const [todayEntry, setTodayEntry] = React.useState<DailySavingEntry | null>(null);
  const [todayStr, setTodayStr] = React.useState<string>(new Date().toISOString().split("T")[0]);
  const [summary, setSummary] = React.useState<SavingsSummary | null>(null);
  const [settings, setSettings] = React.useState<DailySavingsSettings | null>(null);
  const [paymentMethods, setPaymentMethods] = React.useState<PaymentMethodOption[]>([]);

  // UI tabs & modals
  const [activeTab, setActiveTab] = React.useState<"calendar" | "history">("calendar");
  const [isMarkModalOpen, setIsMarkModalOpen] = React.useState(false);
  const [modalTargetDate, setModalTargetDate] = React.useState<string | undefined>(undefined);
  const [editingEntry, setEditingEntry] = React.useState<DailySavingEntry | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = React.useState(false);

  const reloadData = React.useCallback(async (month: string) => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/savings?month=${month}`);
      if (!res.ok) {
        throw new Error("Failed to load savings data");
      }
      const data = await res.json();
      setEntries(data.entries || []);
      setTodayEntry(data.todayEntry || null);
      if (data.todayStr) setTodayStr(data.todayStr);
      setSummary(data.summary || null);
      setSettings(data.settings || null);
      setPaymentMethods(data.paymentMethods || []);
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error("Error fetching savings:", error);
      toast.error(error.message || "Failed to load savings");
    } finally {
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    let ignore = false;
    async function loadInitial() {
      try {
        const res = await fetch(`/api/savings?month=${selectedMonth}`);
        if (!res.ok) {
          throw new Error("Failed to load savings data");
        }
        const data = await res.json();
        if (!ignore) {
          setEntries(data.entries || []);
          setTodayEntry(data.todayEntry || null);
          if (data.todayStr) setTodayStr(data.todayStr);
          setSummary(data.summary || null);
          setSettings(data.settings || null);
          setPaymentMethods(data.paymentMethods || []);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const error = err as { message?: string };
          console.error("Error fetching savings:", error);
          toast.error(error.message || "Failed to load savings");
          setLoading(false);
        }
      }
    }

    if (canView) {
      loadInitial();
    }

    return () => {
      ignore = true;
    };
  }, [canView, selectedMonth]);

  if (!canView) {
    return (
      <AccessDenied
        title="Savings Access Restricted"
        message="You do not have permission to view Daily Savings. Please contact an administrator."
      />
    );
  }

  const handleOpenMarkModal = (date?: string, entry?: DailySavingEntry | null) => {
    setModalTargetDate(date || todayStr);
    setEditingEntry(entry || null);
    setIsMarkModalOpen(true);
  };

  const handleEditEntry = (entry: DailySavingEntry) => {
    setModalTargetDate(entry.date);
    setEditingEntry(entry);
    setIsMarkModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-xs">
            <PiggyBank className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Daily Savings Tracker
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Log daily savings, build consistency streaks, and accumulate reserves
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canManage && (
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground transition shadow-xs"
              title="Savings Goals & Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => reloadData(selectedMonth)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground transition shadow-xs disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <DailySavingsHero
            todayEntry={todayEntry}
            currentStreak={summary?.currentStreak || 0}
            bestStreak={summary?.bestStreak || 0}
            paymentMethods={paymentMethods}
            onOpenMarkModal={handleOpenMarkModal}
          />

          {/* KPI Summary Cards */}
          {summary && <SavingsSummaryCards summary={summary} />}

          {/* View Mode Switcher */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("calendar")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeTab === "calendar"
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Monthly Calendar</span>
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeTab === "history"
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <ListFilter className="w-4 h-4" />
                <span>Ledger History ({entries.length})</span>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "calendar" ? (
            <SavingsCalendarView
              targetMonth={selectedMonth}
              onMonthChange={(m) => setSelectedMonth(m)}
              entries={entries}
              todayStr={todayStr}
              dailyTarget={summary?.dailyTarget || 500}
              onSelectDate={(date, entry) => handleOpenMarkModal(date, entry)}
            />
          ) : (
            <SavingsHistoryTable
              entries={entries}
              onEdit={handleEditEntry}
              onRefresh={() => reloadData(selectedMonth)}
            />
          )}
        </>
      )}

      {/* Mark / Edit Saving Modal */}
      <MarkSavingModal
        isOpen={isMarkModalOpen}
        onClose={() => {
          setIsMarkModalOpen(false);
          setEditingEntry(null);
        }}
        onSuccess={() => reloadData(selectedMonth)}
        defaultDate={modalTargetDate}
        existingEntry={editingEntry}
        paymentMethods={paymentMethods}
        dailyTarget={summary?.dailyTarget || 500}
      />

      {/* Settings Modal */}
      <SavingsSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSuccess={() => reloadData(selectedMonth)}
        currentSettings={settings}
      />
    </div>
  );
}

