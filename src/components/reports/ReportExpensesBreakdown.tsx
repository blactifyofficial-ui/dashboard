import React from 'react';
import type { FinancialReportData } from '@/lib/financial-report-service';
import { Layers, CalendarCheck, Megaphone } from 'lucide-react';

interface ReportExpensesBreakdownProps {
  data: FinancialReportData;
}

export function ReportExpensesBreakdown({ data }: ReportExpensesBreakdownProps) {
  const { expenses } = data;

  const fmtINR = (val: number) => {
    return `₹${val.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-6">
      {/* Category Breakdown Table with visual progress bars */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 sm:px-6 sm:py-3.5 border-b border-border bg-muted/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-muted-foreground" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Operating Expenses by Category</h3>
              <p className="text-xs text-muted-foreground">Distribution of company outflows for this operational period</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-foreground">
            Total: {fmtINR(expenses.total)}
          </span>
        </div>

        <div className="p-4 sm:p-6 space-y-3">
          {expenses.categories.length === 0 ? (
            <p className="text-sm text-center text-muted-foreground py-6">
              No expenses recorded for this month.
            </p>
          ) : (
            expenses.categories.map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{cat.category}</span>
                    <span className="text-muted-foreground text-[11px]">
                      ({cat.count} {cat.count === 1 ? 'transaction' : 'transactions'})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-foreground">{fmtINR(cat.amount)}</span>
                    <span className="text-muted-foreground font-semibold w-12 text-right">
                      {cat.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Monthly Recurring Bills & Subscriptions */}
      {expenses.monthlyBills.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xs">
          <div className="p-4 sm:px-6 sm:py-3.5 border-b border-border bg-muted/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck size={16} className="text-muted-foreground" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">Recurring Monthly Bills & Subscriptions</h3>
                <p className="text-xs text-muted-foreground">Scheduled commitments and fixed operational overheads</p>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-muted-foreground">
              {expenses.monthlyBills.length} registered bills
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/60 text-muted-foreground font-medium border-b border-border">
                <tr>
                  <th className="py-2.5 px-4">Bill Item</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4 text-right">Budgeted</th>
                  <th className="py-2.5 px-4 text-right">Actual Paid</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expenses.monthlyBills.map((b, idx) => (
                  <tr key={idx} className="hover:bg-muted/40 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-foreground">{b.name}</td>
                    <td className="py-2.5 px-4 text-muted-foreground">{b.category}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-muted-foreground">
                      {fmtINR(b.expectedAmount)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-foreground">
                      {fmtINR(b.actualAmount)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          b.status === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

