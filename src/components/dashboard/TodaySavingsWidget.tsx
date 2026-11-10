import Link from "next/link";
import { PiggyBank, Flame, CheckCircle2, ArrowRight } from "lucide-react";
import { db } from "@/db";
import { dailySavings } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getStoreDateParts } from "@/lib/date-utils";

export default async function TodaySavingsWidget() {
  let todayRecord: { id: string; amount: string; destination: string } | null = null;
  let currentStreak = 0;

  try {
    const todayStr = getStoreDateParts().dateStr; // 'YYYY-MM-DD'

    // Fetch today's entry
    const [fetchedToday] = await db
      .select({
        id: dailySavings.id,
        amount: dailySavings.amount,
        destination: dailySavings.destination,
      })
      .from(dailySavings)
      .where(eq(dailySavings.date, todayStr))
      .limit(1);

    if (fetchedToday) {
      todayRecord = fetchedToday;
    }

    // Fetch dates for streak
    const allRecords = await db
      .select({ date: dailySavings.date })
      .from(dailySavings)
      .orderBy(desc(dailySavings.date));

    const dateSet = new Set(allRecords.map((r) => r.date));

    const todayDate = new Date(todayStr + "T00:00:00");
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

    const checkDate = dateSet.has(todayStr)
      ? new Date(todayDate)
      : dateSet.has(yesterdayStr)
      ? new Date(yesterdayDate)
      : null;

    if (checkDate) {
      while (true) {
        const dStr = checkDate.toISOString().split("T")[0];
        if (dateSet.has(dStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }
  } catch (error) {
    console.error("Error loading TodaySavingsWidget data:", error);
    return null;
  }

  const isSaved = Boolean(todayRecord && Number(todayRecord.amount) > 0);
  const amount = todayRecord ? Number(todayRecord.amount) : 0;

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            isSaved
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
          }`}
        >
          <PiggyBank className="w-5 h-5" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Daily Savings
            </span>
            {currentStreak > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                {currentStreak}d Streak
              </span>
            )}
          </div>

          {isSaved ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-sm font-bold text-foreground">
                Saved ₹{amount.toLocaleString("en-IN")} today!
              </span>
            </div>
          ) : (
            <div className="text-sm font-medium text-foreground mt-0.5">
              Today&apos;s saving pending
            </div>
          )}
        </div>
      </div>

      <Link
        href="/savings"
        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 ${
          isSaved
            ? "bg-muted/50 hover:bg-muted text-foreground border border-border"
            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20"
        }`}
      >
        <span>{isSaved ? "View Tracker" : "Mark Today's Saving"}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
