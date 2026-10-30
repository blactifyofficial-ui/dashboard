import { requireAuth } from '@/lib/auth-utils';
import { hasPermission, canAccessRoute } from '@/lib/rbac';
import AccessDenied from '@/components/AccessDenied';
import { redirect } from 'next/navigation';
import { getOrCompileMonthlyReport } from '@/lib/financial-report-service';
import { ReportActionButtons } from '@/components/reports/ReportActionButtons';
import { ReportKpiGrid } from '@/components/reports/ReportKpiGrid';
import { ReportSalesBreakdown } from '@/components/reports/ReportSalesBreakdown';
import { ReportExpensesBreakdown } from '@/components/reports/ReportExpensesBreakdown';
import { db } from '@/db';
import { monthlyFinancialReports } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Info,
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function MonthlyReportDetailPage(props: {
  params: Promise<{ month: string }>;
}) {
  const authRes = await requireAuth();
  if (authRes.error) {
    if (authRes.status === 401) {
      redirect('/login');
    }
    return <AccessDenied message={authRes.error} />;
  }

  if (!canAccessRoute(authRes.role, '/reports', authRes.permissions)) {
    return <AccessDenied message="You do not have permission to view monthly company financial reports." />;
  }

  const { month } = await props.params;

  let reportData;
  try {
    reportData = await getOrCompileMonthlyReport(month);
  } catch (err: unknown) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-rose-600">Error Loading Financial Report</h2>
        <p className="text-sm text-muted-foreground">
          {err instanceof Error ? err.message : 'Could not generate report for the requested month.'}
        </p>
        <Link
          href="/reports"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border text-sm font-semibold"
        >
          <ArrowLeft size={16} /> Back to Reports
        </Link>
      </div>
    );
  }

  // Check email sent status
  const [reportRecord] = await db
    .select({ emailSentAt: monthlyFinancialReports.emailSentAt })
    .from(monthlyFinancialReports)
    .where(eq(monthlyFinancialReports.month, month))
    .limit(1);

  const emailSentAtStr = reportRecord?.emailSentAt ? reportRecord.emailSentAt.toISOString() : null;
  const canGenerate = hasPermission(authRes.role, 'reports:generate', authRes.permissions);

  const fmtINR = (val: number) => {
    return `₹${val.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatGrowth = (pct: number | null) => {
    if (pct === null) return 'N/A';
    return (pct >= 0 ? '+' : '') + `${pct.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6 relative z-10 text-foreground">
      {/* Header with Navigation and Action Toolbar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/reports"
            aria-label="Back to Reports"
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg bg-card hover:bg-muted text-foreground transition-colors border border-border shrink-0 shadow-2xs"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {reportData.meta.monthDisplay} Financial Report
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={11} /> Finalized
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Period: {reportData.meta.monthDisplay} &bull; Released on {reportData.meta.reportReleaseDate}
            </p>
          </div>
        </div>

        <ReportActionButtons
          month={month}
          monthDisplay={reportData.meta.monthDisplay}
          emailSentAt={emailSentAtStr}
          canGenerate={canGenerate}
        />
      </header>

      {/* KPI Cards Grid */}
      <ReportKpiGrid data={reportData} />

      {/* Executive Highlights & Commentary */}
      {reportData.executiveNotes.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Executive Highlights & Closure Summary
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {reportData.executiveNotes.map((note, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground flex items-start gap-2.5 leading-relaxed"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Month-over-Month (MoM) Comparison Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 sm:px-6 sm:py-3.5 border-b border-border bg-muted/40 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Month-over-Month (MoM) Performance Ledger
            </h3>
            <p className="text-xs text-muted-foreground">
              Comparing {reportData.meta.monthDisplay} against the preceding calendar month
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 text-muted-foreground font-medium border-b border-border">
              <tr>
                <th className="py-2.5 px-4">Financial Indicator</th>
                <th className="py-2.5 px-4 text-right">Current Month</th>
                <th className="py-2.5 px-4 text-right">Prior Month</th>
                <th className="py-2.5 px-4 text-right">MoM Variance (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="hover:bg-muted/40 transition-colors">
                <td className="py-2.5 px-4 font-semibold text-foreground">Gross Sales Revenue</td>
                <td className="py-2.5 px-4 text-right font-mono font-bold text-foreground">
                  {fmtINR(reportData.kpis.totalRevenue)}
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-muted-foreground">
                  {fmtINR(reportData.kpis.mom.prevRevenue)}
                </td>
                <td className="py-2.5 px-4 text-right">
                  <span
                    className={`inline-flex items-center gap-1 font-semibold ${
                      (reportData.kpis.mom.revenueGrowthPct || 0) >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatGrowth(reportData.kpis.mom.revenueGrowthPct)}
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-muted/40 transition-colors">
                <td className="py-2.5 px-4 font-semibold text-foreground">Total Operating Expenses</td>
                <td className="py-2.5 px-4 text-right font-mono font-bold text-foreground">
                  {fmtINR(reportData.kpis.totalExpenses)}
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-muted-foreground">
                  {fmtINR(reportData.kpis.mom.prevExpenses)}
                </td>
                <td className="py-2.5 px-4 text-right text-muted-foreground">—</td>
              </tr>

              <tr className="hover:bg-muted/40 transition-colors">
                <td className="py-2.5 px-4 font-semibold text-foreground">Net Operating Profit</td>
                <td
                  className={`py-2.5 px-4 text-right font-mono font-bold ${
                    reportData.kpis.netProfit >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {reportData.kpis.netProfit < 0 ? '-' : ''}
                  {fmtINR(Math.abs(reportData.kpis.netProfit))}
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-muted-foreground">
                  {fmtINR(reportData.kpis.mom.prevNetProfit)}
                </td>
                <td className="py-2.5 px-4 text-right">
                  <span
                    className={`inline-flex items-center gap-1 font-semibold ${
                      (reportData.kpis.mom.profitGrowthPct || 0) >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatGrowth(reportData.kpis.mom.profitGrowthPct)}
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-muted/40 transition-colors">
                <td className="py-2.5 px-4 font-semibold text-foreground">Total Customer Orders</td>
                <td className="py-2.5 px-4 text-right font-mono font-bold text-foreground">
                  {reportData.kpis.totalOrders}
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-muted-foreground">
                  {reportData.kpis.mom.prevOrders}
                </td>
                <td className="py-2.5 px-4 text-right">
                  <span
                    className={`inline-flex items-center gap-1 font-semibold ${
                      (reportData.kpis.mom.ordersGrowthPct || 0) >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatGrowth(reportData.kpis.mom.ordersGrowthPct)}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Sales & Payment Channel Breakdown */}
      <ReportSalesBreakdown data={reportData} />

      {/* Operating Expenses Breakdown */}
      <ReportExpensesBreakdown data={reportData} />
    </div>
  );
}

