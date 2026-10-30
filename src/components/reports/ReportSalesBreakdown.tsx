import React from 'react';
import type { FinancialReportData } from '@/lib/financial-report-service';
import { CreditCard, Banknote, PackageCheck, AlertCircle } from 'lucide-react';

interface ReportSalesBreakdownProps {
  data: FinancialReportData;
}

export function ReportSalesBreakdown({ data }: ReportSalesBreakdownProps) {
  const { sales } = data;

  const fmtINR = (val: number) => {
    return `₹${val.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-6">
      {/* Payment Channel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Prepaid */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CreditCard size={16} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Prepaid / Online Payments</h4>
                <p className="text-xs text-muted-foreground">Instant digital checkout conversion</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {sales.prepaid.percentage}% of sales
            </span>
          </div>

          <div className="pt-2 border-t border-border flex items-baseline justify-between">
            <div>
              <span className="text-xs text-muted-foreground">Prepaid Volume</span>
              <p className="text-lg font-bold font-mono text-foreground">{fmtINR(sales.prepaid.revenue)}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Total Orders</span>
              <p className="text-base font-semibold text-foreground">{sales.prepaid.count}</p>
            </div>
          </div>
        </div>

        {/* Cash on Delivery */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Banknote size={16} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Cash on Delivery (COD)</h4>
                <p className="text-xs text-muted-foreground">Doorstep collections & remittances</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              {sales.cod.percentage}% of sales
            </span>
          </div>

          <div className="pt-2 border-t border-border flex items-baseline justify-between">
            <div>
              <span className="text-xs text-muted-foreground">COD Gross Value</span>
              <p className="text-lg font-bold font-mono text-foreground">{fmtINR(sales.cod.revenue)}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Total Orders</span>
              <p className="text-base font-semibold text-foreground">{sales.cod.count}</p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground flex items-center justify-between pt-1">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <PackageCheck size={13} /> Collected: {fmtINR(sales.cod.collectedAmount)}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground font-medium">
              <AlertCircle size={13} /> Pending: {fmtINR(sales.cod.pendingAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Top 10 Selling Products Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 sm:px-6 sm:py-3.5 border-b border-border bg-muted/40 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Top 10 Best-Selling Products</h3>
            <p className="text-xs text-muted-foreground">Merchandise generating the highest revenue this month</p>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {sales.topProducts.length} items ranked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 text-muted-foreground font-medium border-b border-border">
              <tr>
                <th className="py-2.5 px-4 w-12 text-center">#</th>
                <th className="py-2.5 px-4">Product Name</th>
                <th className="py-2.5 px-4 text-center">Volume Sold</th>
                <th className="py-2.5 px-4 text-right">Revenue Generated</th>
                <th className="py-2.5 px-4 text-right w-24">Sales Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sales.topProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No product line items recorded for this month.
                  </td>
                </tr>
              ) : (
                sales.topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-muted/40 transition-colors">
                    <td className="py-2.5 px-4 text-center font-medium text-muted-foreground">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-foreground">
                      {p.title}
                    </td>
                    <td className="py-2.5 px-4 text-center text-muted-foreground font-mono">
                      {p.quantity} units
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold font-mono text-foreground">
                      {fmtINR(p.revenue)}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary">
                        {p.percentage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

