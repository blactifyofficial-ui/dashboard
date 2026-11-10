"use client";

import * as React from "react";
import { Search, Edit3, Trash2, PiggyBank } from "lucide-react";
import { toast } from "react-hot-toast";
import { DailySavingEntry, SAVINGS_DESTINATIONS } from "./types";

interface SavingsHistoryTableProps {
  entries: DailySavingEntry[];
  onEdit: (entry: DailySavingEntry) => void;
  onRefresh: () => void;
}

export function SavingsHistoryTable({ entries, onEdit, onRefresh }: SavingsHistoryTableProps) {
  const [search, setSearch] = React.useState("");
  const [selectedDestination, setSelectedDestination] = React.useState<string>("ALL");
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const filteredEntries = React.useMemo(() => {
    return entries.filter((entry) => {
      const matchSearch =
        search === "" ||
        entry.date.includes(search) ||
        (entry.note && entry.note.toLowerCase().includes(search.toLowerCase())) ||
        (entry.paymentMethodName && entry.paymentMethodName.toLowerCase().includes(search.toLowerCase()));

      const matchDest =
        selectedDestination === "ALL" || entry.destination === selectedDestination;

      return matchSearch && matchDest;
    });
  }, [entries, search, selectedDestination]);

  const handleDelete = async (id: string, date: string) => {
    if (!confirm(`Are you sure you want to delete the saving entry for ${date}?`)) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await fetch(`/api/savings/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete entry");
      }

      toast.success(`Deleted saving record for ${date}`);
      onRefresh();
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const getDestinationMeta = (dest: string) => {
    const found = SAVINGS_DESTINATIONS.find((d) => d.value === dest);
    return found || { label: dest, icon: "🏦", color: "blue" };
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-5 md:p-6 shadow-xs space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground">Savings History Ledger</h3>
          <p className="text-xs text-muted-foreground">
            {filteredEntries.length} record{filteredEntries.length === 1 ? "" : "s"} logged this month
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search note or date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Destination Filter */}
          <select
            value={selectedDestination}
            onChange={(e) => setSelectedDestination(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Destinations</option>
            {SAVINGS_DESTINATIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.icon} {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-muted/10">
          <PiggyBank className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold text-foreground">No savings logged</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log your daily savings using the calendar or button above.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-semibold">
                <th className="pb-3 pl-3">Date</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Destination Stash</th>
                <th className="pb-3">Method</th>
                <th className="pb-3">Note / Context</th>
                <th className="pb-3 pr-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredEntries.map((entry) => {
                const destMeta = getDestinationMeta(entry.destination);
                const amt = Number(entry.amount) || 0;

                return (
                  <tr key={entry.id} className="hover:bg-muted/30 transition group">
                    <td className="py-3.5 pl-3 font-semibold text-foreground whitespace-nowrap">
                      {entry.date}
                    </td>
                    <td className="py-3.5 font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      ₹{amt.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 text-foreground border border-border font-medium text-[11px]">
                        <span>{destMeta.icon}</span>
                        <span>{destMeta.label}</span>
                      </span>
                    </td>
                    <td className="py-3.5 text-muted-foreground whitespace-nowrap">
                      {entry.paymentMethodName || "—"}
                    </td>
                    <td className="py-3.5 text-muted-foreground max-w-xs truncate">
                      {entry.note || "—"}
                    </td>
                    <td className="py-3.5 pr-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                        <button
                          onClick={() => onEdit(entry)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id, entry.date)}
                          disabled={deletingId === entry.id}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-500/10 transition disabled:opacity-40"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

