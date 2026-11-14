import { db } from '@/db';
import { orders, expenses } from '@/db/schema';
import { and, gte, lt, desc, isNull } from 'drizzle-orm';
import { ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';
import MonthRevenueView from '@/components/revenue/MonthRevenueView';
import { getStoreMonthRange, getStoreNow, getStoreYesterdayRange } from '@/lib/date-utils';
import { Suspense } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { requirePermission } from '@/lib/auth-utils';
import { hasPermission } from '@/lib/rbac';
import AccessDenied from '@/components/AccessDenied';

export const dynamic = "force-dynamic";

export default async function MonthRevenuePage(props: {
  params: Promise<{ month: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const authRes = await requirePermission('revenue:view');
  if ('error' in authRes) {
    return <AccessDenied message="You do not have permission to view revenue and sales performance." />;
  }

  const canViewExpenses = hasPermission(authRes.role, 'expenses:view', authRes.permissions);

  const params = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : {};
  const weekParam = typeof searchParams.week === 'string' ? searchParams.week : 'all';
  const monthParam = params.month; // e.g. "2026-10"

  const [yearStr, monthStr] = monthParam.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  if (isNaN(year) || isNaN(month)) {
    return <div className="text-foreground">Invalid month</div>;
  }

  // Calculate month boundaries in store timezone (Asia/Kolkata, UTC+05:30)
  const { startDate, endDate } = getStoreMonthRange(year, month);

  const monthDisplay = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4 sm:space-y-6 relative z-10 text-foreground">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href="/revenue"
            aria-label="Back to Revenue"
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg bg-card hover:bg-muted text-foreground transition-colors border border-border shrink-0 shadow-xs"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{monthDisplay} Revenue</h1>
            <p className="text-muted-foreground text-xs">Overview, profit performance, and order breakdown for this month</p>
          </div>
        </div>
        <Link
          href={`/reports/${monthParam}`}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs self-start sm:self-auto"
        >
          <FileText size={14} />
          <span>Official Report & PDF</span>
        </Link>
      </header>

      <Suspense fallback={<LoadingSpinner />}>
        <MonthRevenueContent
          year={year}
          month={month}
          startDate={startDate}
          endDate={endDate}
          canViewExpenses={canViewExpenses}
          initialWeekId={weekParam}
        />
      </Suspense>
    </div>
  );
}

async function MonthRevenueContent({
  year,
  month,
  startDate,
  endDate,
  canViewExpenses,
  initialWeekId = 'all',
}: {
  year: number;
  month: number;
  startDate: Date;
  endDate: Date;
  canViewExpenses: boolean;
  initialWeekId?: string;
}) {
  // Get orders for this month with all details, filtered by store 24h timezone boundaries
  const monthOrders = await db.select({
    id: orders.id,
    orderNumber: orders.orderNumber,
    customerName: orders.customerName,
    customerEmail: orders.customerEmail,
    totalPrice: orders.totalPrice,
    totalOutstanding: orders.totalOutstanding,
    currency: orders.currency,
    createdAt: orders.createdAt,
    financialStatus: orders.financialStatus,
    fulfillmentStatus: orders.fulfillmentStatus,
    paymentGateway: orders.paymentGateway,
    trackingId: orders.trackingId,
    trackingCompany: orders.trackingCompany,
    trackingUrl: orders.trackingUrl,
    codStatus: orders.codStatus,
  })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, startDate),
        lt(orders.createdAt, endDate)
      )
    )
    .orderBy(desc(orders.createdAt));

  const now = getStoreNow();
  const isCurrentMonth = year === now.year && month === now.month;

  // If current month and day 1, yesterday's orders occurred in previous month.
  // Fetch them so the 24h Yesterday view has full data.
  let yesterdayExtraOrders: Array<{ createdAt: string; revenue: number }> = [];
  if (isCurrentMonth && now.day === 1) {
    const yRange = getStoreYesterdayRange();
    const yOrders = await db.select({
      createdAt: orders.createdAt,
      totalPrice: orders.totalPrice,
    })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, yRange.startDate),
          lt(orders.createdAt, yRange.endDate)
        )
      );
    yesterdayExtraOrders = yOrders.map((o) => ({
      createdAt: o.createdAt ? o.createdAt.toISOString() : '',
      revenue: parseFloat(o.totalPrice || '0') || 0,
    }));
  }

  // Fetch individual expenses with expenseDate for exact weekly filtering
  let expensesList: Array<{ amount: number; expenseDate: Date | string | null }> = [];
  if (canViewExpenses) {
    const expensesRows = await db
      .select({
        amount: expenses.amount,
        expenseDate: expenses.expenseDate,
      })
      .from(expenses)
      .where(
        and(
          isNull(expenses.deletedAt),
          gte(expenses.expenseDate, startDate),
          lt(expenses.expenseDate, endDate)
        )
      );
    expensesList = expensesRows.map((e) => ({
      amount: parseFloat(e.amount || '0') || 0,
      expenseDate: e.expenseDate,
    }));
  }

  const monthDisplay = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <MonthRevenueView
      year={year}
      month={month}
      monthDisplay={monthDisplay}
      monthOrders={monthOrders}
      expenses={expensesList}
      yesterdayExtraOrders={yesterdayExtraOrders}
      canViewExpenses={canViewExpenses}
      initialWeekId={initialWeekId}
    />
  );
}
