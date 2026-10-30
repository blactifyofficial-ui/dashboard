import { requireAuth } from '@/lib/auth-utils';
import { canAccessRoute } from '@/lib/rbac';
import AccessDenied from '@/components/AccessDenied';
import { redirect } from 'next/navigation';
import { listMonthlyFinancialReports, getOrCompileMonthlyReport } from '@/lib/financial-report-service';
import { ReportPdfDownloadButton } from '@/components/reports/ReportPdfDownloadButton';
import {
  FileText,
  CalendarCheck,
  ArrowUpRight,
  Sparkles,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const authRes = await requireAuth();
  if (authRes.error) {
    if (authRes.status === 401) {
      redirect('/login');
    }
    return <AccessDenied message={authRes.error} />;
  }

  if (!canAccessRoute(authRes.role, '/reports', authRes.permissions)) {
    return <AccessDenied message="You do not have permission to view company financial reports." />;
  }

  const { reports } = await listMonthlyFinancialReports();

  // If reports exist, fetch or compile the latest report to ensure rich data
  const latestMonthItem = reports[0];
  let latestReportData = null;
  if (latestMonthItem) {
    try {
      latestReportData = await getOrCompileMonthlyReport(latestMonthItem.month);
    } catch (err) {
      console.warn('Error loading latest report details:', err);
    }
  }

  const fmtINR = (val: number) => {
    return `₹${val.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="flex flex-col h-full space-y-6 relative z-10 text-foreground">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Monthly Financial Reports
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              <Sparkles size={11} /> 1st of Month Automated
            </span>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            Company-level financial closures, executive performance statements, and downloadable PDF reports
          </p>
        </div>
      </header>

      {/* Automated Schedule Info Banner */}
      <div className="bg-muted/40 border border-border rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <Clock size={18} />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold text-foreground">
              Automated Month-End Closure Schedule
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              When a month ends, a full financial intelligence report is compiled on all the <strong>1st day of the new month</strong> (e.g. October 1 to October 31 report released on <strong>November 1</strong>). PDF statements can be downloaded anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Latest Closed Month Spotlight Card */}
      {latestReportData && (
        <div className="bg-card border border-border rounded-xl p-5 sm:p-6 relative overflow-hidden shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold shadow-xs">
                <FileText size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">
                    {latestReportData.meta.monthDisplay} Financial Report
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={11} /> Official Release
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Reporting Period: {latestReportData.meta.monthDisplay} | Delivered on {latestReportData.meta.reportReleaseDate}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <ReportPdfDownloadButton
                month={latestReportData.meta.month}
                monthDisplay={latestReportData.meta.monthDisplay}
                variant="primary"
                size="md"
                label="Download PDF Report"
              />
              <Link
                href={`/reports/${latestReportData.meta.month}`}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-colors min-h-[38px] border border-border"
              >
                <span>View Breakdown</span>
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-border">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Gross Sales
              </span>
              <p className="text-base sm:text-lg font-bold font-mono text-foreground">
                {fmtINR(latestReportData.kpis.totalRevenue)}
              </p>
              <p className="text-xs text-muted-foreground">
                {latestReportData.kpis.totalOrders} customer orders
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Operating Expenses
              </span>
              <p className="text-base sm:text-lg font-bold font-mono text-muted-foreground">
                {fmtINR(latestReportData.kpis.totalExpenses)}
              </p>
              <p className="text-xs text-muted-foreground">
                {latestReportData.expenses.categories.length} expense categories
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Net Operating Profit
              </span>
              <p
                className={`text-base sm:text-lg font-bold font-mono ${
                  latestReportData.kpis.netProfit >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {latestReportData.kpis.netProfit < 0 ? '-' : ''}
                {fmtINR(Math.abs(latestReportData.kpis.netProfit))}
              </p>
              <p className="text-xs text-muted-foreground">
                Margin: {latestReportData.kpis.profitMargin}%
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Order Split
              </span>
              <p className="text-base sm:text-lg font-bold font-mono text-foreground">
                {fmtINR(latestReportData.kpis.aov)} <span className="text-xs font-normal text-muted-foreground font-sans">AOV</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Prepaid {latestReportData.sales.prepaid.percentage}% &bull; COD {latestReportData.sales.cod.percentage}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Historical Monthly Reports Ledger */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 sm:px-6 sm:py-4 border-b border-border bg-muted/40 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">All Monthly Statements</h2>
            <p className="text-xs text-muted-foreground">
              Historical monthly closures available for inspection and PDF export
            </p>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {reports.length} {reports.length === 1 ? 'month' : 'months'} available
          </span>
        </div>

        <div className="divide-y divide-border">
          {reports.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground">
                <FileText size={24} />
              </div>
              <p className="text-sm font-medium text-foreground">No monthly reports compiled yet.</p>
              <p className="text-xs text-muted-foreground">Reports will automatically compile on the 1st day of the next month.</p>
            </div>
          ) : (
            reports.map((item) => (
              <div
                key={item.month}
                className="p-4 sm:px-6 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                    <CalendarCheck size={18} className="text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/reports/${item.month}`}
                        className="text-sm sm:text-base font-semibold text-foreground hover:underline"
                      >
                        {item.monthDisplay} Report
                      </Link>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border uppercase">
                        {item.month}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.totalOrders} orders completed &bull; Released on the 1st
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-6 self-start md:self-auto">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Revenue
                    </span>
                    <p className="text-sm sm:text-base font-semibold font-mono text-foreground">
                      {fmtINR(item.totalRevenue)}
                    </p>
                  </div>

                  <div className="text-left md:text-right">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Expenses
                    </span>
                    <p className="text-sm sm:text-base font-semibold font-mono text-muted-foreground">
                      {fmtINR(item.totalExpenses)}
                    </p>
                  </div>

                  <div className="text-left md:text-right min-w-[100px]">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Net Profit
                    </span>
                    <p
                      className={`text-sm sm:text-base font-bold font-mono ${
                        item.netProfit >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {item.netProfit < 0 ? '-' : ''}
                      {fmtINR(Math.abs(item.netProfit))}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <ReportPdfDownloadButton
                      month={item.month}
                      monthDisplay={item.monthDisplay}
                      variant="outline"
                      size="sm"
                      label="PDF"
                    />
                    <Link
                      href={`/reports/${item.month}`}
                      className="inline-flex items-center justify-center p-2 rounded-lg bg-card hover:bg-muted text-foreground transition-colors border border-border min-h-[32px] min-w-[32px] shadow-2xs"
                      title="Open full report"
                    >
                      <ArrowUpRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

