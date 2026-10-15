'use client';

import Link from 'next/link';
import { CreditCard, Banknote, PackageCheck, Package, Clock, Receipt, CheckCircle2, ArrowUpRight } from 'lucide-react';

export interface RecentMonthlyBill {
  id: string;
  name: string;
  category: string;
  expectedAmount: string;
  actualAmount: string | null;
  status: string;
  dueDay: string | null;
}

export interface PaymentAndFulfillmentCardProps {
  canViewRevenue: boolean;
  canViewExpenses?: boolean;
  prepaidCount: number;
  prepaidRevenue: number;
  codCount: number;
  codRevenue: number;
  fulfilledCount: number;
  unfulfilledCount: number;
  partiallyFulfilledCount?: number;
  totalMtdExpenses?: number;
  mtdExpensesCount?: number;
  monthlyBillsPaidAmount?: number;
  monthlyBillsPendingAmount?: number;
  monthlyBillsPaidCount?: number;
  monthlyBillsTotalCount?: number;
  recentMonthlyBills?: RecentMonthlyBill[];
}

export default function PaymentAndFulfillmentCard({
  canViewRevenue,
  canViewExpenses = false,
  prepaidCount,
  prepaidRevenue,
  codCount,
  codRevenue,
  fulfilledCount,
  unfulfilledCount,
  partiallyFulfilledCount = 0,
  totalMtdExpenses = 0,
  monthlyBillsPaidAmount = 0,
  monthlyBillsPendingAmount = 0,
  monthlyBillsPaidCount = 0,
  monthlyBillsTotalCount = 0,
  recentMonthlyBills = [],
}: PaymentAndFulfillmentCardProps) {
  const totalOrders = prepaidCount + codCount;
  const totalRevenue = prepaidRevenue + codRevenue;

  const prepaidOrdersPercent = totalOrders > 0 ? Math.round((prepaidCount / totalOrders) * 100) : 0;
  const codOrdersPercent = totalOrders > 0 ? 100 - prepaidOrdersPercent : 0;

  const prepaidRevenuePercent = totalRevenue > 0 ? Math.round((prepaidRevenue / totalRevenue) * 100) : 0;
  const codRevenuePercent = totalRevenue > 0 ? 100 - prepaidRevenuePercent : 0;

  // Monthly Bills percentages
  const totalBillsAmount = monthlyBillsPaidAmount + monthlyBillsPendingAmount;
  const billsPaidPercent = totalBillsAmount > 0 
    ? Math.round((monthlyBillsPaidAmount / totalBillsAmount) * 100)
    : (monthlyBillsTotalCount > 0 ? Math.round((monthlyBillsPaidCount / monthlyBillsTotalCount) * 100) : 100);
  const billsPendingPercent = totalBillsAmount > 0 ? 100 - billsPaidPercent : (100 - billsPaidPercent);

  return (
    <div className={`grid grid-cols-1 ${canViewExpenses ? 'md:grid-cols-2 lg:grid-cols-3' : 'lg:grid-cols-2'} gap-4`}>
      {/* 1. Payment Mix Card */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-tight">Payment Channel Distribution</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Prepaid vs Cash on Delivery (Current Month)</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Prepaid
              </span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> COD
              </span>
            </div>
          </div>

          {/* Segmented Visual Bar */}
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden flex my-3">
            <div
              style={{ width: `${prepaidOrdersPercent}%` }}
              className="bg-emerald-500 h-full transition-all duration-500 rounded-l-full"
              title={`Prepaid: ${prepaidOrdersPercent}%`}
            />
            <div
              style={{ width: `${codOrdersPercent}%` }}
              className="bg-amber-500 h-full transition-all duration-500 rounded-r-full"
              title={`COD: ${codOrdersPercent}%`}
            />
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/70 mt-2">
          {/* Prepaid */}
          <div className="bg-muted/40 border border-border/50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1">
              <CreditCard size={14} className="text-emerald-500" />
              <span>Prepaid ({prepaidOrdersPercent}%)</span>
            </div>
            <div className="space-y-0.5">
              {canViewRevenue && (
                <p className="text-base font-bold font-mono text-foreground">
                  ₹{Math.round(prepaidRevenue).toLocaleString('en-IN')}{' '}
                  <span className="text-[11px] font-normal text-muted-foreground font-sans">
                    ({prepaidRevenuePercent}%)
                  </span>
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground font-mono">{prepaidCount}</strong> orders
              </p>
            </div>
          </div>

          {/* COD */}
          <div className="bg-muted/40 border border-border/50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1">
              <Banknote size={14} className="text-amber-500" />
              <span>COD ({codOrdersPercent}%)</span>
            </div>
            <div className="space-y-0.5">
              {canViewRevenue && (
                <p className="text-base font-bold font-mono text-foreground">
                  ₹{Math.round(codRevenue).toLocaleString('en-IN')}{' '}
                  <span className="text-[11px] font-normal text-muted-foreground font-sans">
                    ({codRevenuePercent}%)
                  </span>
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground font-mono">{codCount}</strong> orders
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Fulfillment Status Card */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-tight">Fulfillment Pipeline</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Operational dispatch and shipping health</p>
            </div>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {totalOrders} Total Orders
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 my-3">
            {/* Fulfilled */}
            <div className="border border-border/70 rounded-lg p-3 bg-card flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground text-[11px] mb-1">
                <span>Fulfilled</span>
                <PackageCheck size={14} className="text-emerald-500" />
              </div>
              <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {fulfilledCount}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {totalOrders > 0 ? Math.round((fulfilledCount / totalOrders) * 100) : 0}% of total
              </p>
            </div>

            {/* Unfulfilled */}
            <div className={`border rounded-lg p-3 flex flex-col justify-between ${
              unfulfilledCount > 0 ? 'border-amber-500/40 bg-amber-500/5' : 'border-border/70 bg-card'
            }`}>
              <div className="flex items-center justify-between text-muted-foreground text-[11px] mb-1">
                <span className={unfulfilledCount > 0 ? 'text-amber-700 dark:text-amber-400 font-semibold' : ''}>
                  Unfulfilled
                </span>
                <Package size={14} className={unfulfilledCount > 0 ? 'text-amber-500' : 'text-muted-foreground'} />
              </div>
              <p className={`text-xl font-bold font-mono ${
                unfulfilledCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
              }`}>
                {unfulfilledCount}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {unfulfilledCount > 0 ? 'Awaiting dispatch' : 'All dispatched'}
              </p>
            </div>

            {/* Partially Fulfilled or In Transit */}
            <div className="border border-border/70 rounded-lg p-3 bg-card flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground text-[11px] mb-1">
                <span>Partial / Other</span>
                <Clock size={14} className="text-blue-500" />
              </div>
              <p className="text-xl font-bold font-mono text-foreground">
                {partiallyFulfilledCount}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Split shipments
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 text-xs text-muted-foreground flex items-center justify-between">
          <span>Tracking syncs automatically with carrier webhooks</span>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">● 100% Up to date</span>
        </div>
      </div>

      {/* 3. Monthly Expenses & Recurring Bills Card */}
      {canViewExpenses && (
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-1.5">
                  <Receipt size={15} className="text-rose-500 shrink-0" />
                  Monthly Expenses & Bills
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Recurring commitments & operating spend</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Paid
                </span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Pending
                </span>
              </div>
            </div>

            {/* Segmented Visual Bar */}
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden flex my-3">
              <div
                style={{ width: `${billsPaidPercent}%` }}
                className="bg-emerald-500 h-full transition-all duration-500 rounded-l-full"
                title={`Paid: ${billsPaidPercent}%`}
              />
              <div
                style={{ width: `${billsPendingPercent}%` }}
                className="bg-amber-500 h-full transition-all duration-500 rounded-r-full"
                title={`Pending: ${billsPendingPercent}%`}
              />
            </div>

            {/* Split Metrics: Paid vs Pending */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/70 mt-2">
              <div className="bg-muted/40 border border-border/50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>Paid Bills ({billsPaidPercent}%)</span>
                </div>
                <div className="space-y-0.5">
                  <p className="text-base font-bold font-mono text-foreground">
                    ₹{Math.round(monthlyBillsPaidAmount).toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground font-mono">{monthlyBillsPaidCount}</strong> of {monthlyBillsTotalCount} settled
                  </p>
                </div>
              </div>

              <div className="bg-muted/40 border border-border/50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1">
                  <Clock size={14} className="text-amber-500 shrink-0" />
                  <span>Pending ({billsPendingPercent}%)</span>
                </div>
                <div className="space-y-0.5">
                  <p className="text-base font-bold font-mono text-foreground">
                    ₹{Math.round(monthlyBillsPendingAmount).toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground font-mono">{Math.max(0, monthlyBillsTotalCount - monthlyBillsPaidCount)}</strong> due
                  </p>
                </div>
              </div>
            </div>

            {/* Recent / Upcoming Bills Preview List */}
            {recentMonthlyBills.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/60 space-y-1.5">
                {recentMonthlyBills.slice(0, 3).map((bill) => {
                  const isPaid = bill.status === 'PAID';
                  const amount = parseFloat(isPaid && bill.actualAmount ? bill.actualAmount : bill.expectedAmount) || 0;
                  return (
                    <div key={bill.id} className="flex items-center justify-between text-xs py-0.5">
                      <span className="truncate max-w-[170px] text-foreground/90 font-medium">{bill.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-medium text-foreground">₹{Math.round(amount).toLocaleString('en-IN')}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          isPaid 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}>
                          {isPaid ? 'PAID' : 'DUE'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border/70 mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Total MTD Spend: <strong className="text-foreground font-mono font-semibold">₹{Math.round(totalMtdExpenses).toLocaleString('en-IN')}</strong>
            </span>
            <Link
              href="/monthly-expenses"
              className="text-primary hover:underline font-medium flex items-center gap-1 group"
            >
              <span>Manage Bills</span>
              <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
