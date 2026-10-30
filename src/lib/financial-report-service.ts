import { db } from '@/db';
import {
  orders,
  orderItems,
  expenses,
  expenseCategories,
  monthlyExpenseEntries,
  metaAdsTransactions,
  partnerTransactions,
  monthlyFinancialReports,
  allowedUsers,
} from '@/db/schema';
import { and, gte, lt, isNull, eq, sql, desc } from 'drizzle-orm';
import { getStoreMonthRange, getStoreDay, getStoreDateParts, getStoreNow } from './date-utils';
import { isCodOrder, getCodAmountToCollect, getPrepaidAmount } from './order-utils';
import { generateFinancialReportPdfBuffer } from './financial-report-pdf';
import { sendMonthlyReportEmail } from './email';

export interface ReportKpis {
  totalRevenue: number;
  totalOrders: number;
  aov: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  mom: {
    revenueGrowthPct: number | null;
    ordersGrowthPct: number | null;
    profitGrowthPct: number | null;
    prevRevenue: number;
    prevExpenses: number;
    prevNetProfit: number;
    prevOrders: number;
  };
}

export interface ReportCategoryExpense {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface ReportTopProduct {
  title: string;
  quantity: number;
  revenue: number;
  percentage: number;
}

export interface ReportDailySales {
  day: number;
  dateStr: string;
  revenue: number;
  ordersCount: number;
}

export interface ReportMonthlyBillEntry {
  name: string;
  category: string;
  expectedAmount: number;
  actualAmount: number;
  status: string;
}

export interface FinancialReportData {
  meta: {
    id: string;
    month: string; // 'YYYY-MM'
    monthDisplay: string; // 'October 2026'
    year: number;
    monthNumber: number;
    startDate: string;
    endDate: string;
    reportReleaseDate: string; // 'November 1, 2026'
    currency: string;
    status: string;
    generatedAt: string;
  };
  kpis: ReportKpis;
  sales: {
    prepaid: {
      count: number;
      revenue: number;
      percentage: number;
    };
    cod: {
      count: number;
      revenue: number;
      percentage: number;
      collectedAmount: number;
      pendingAmount: number;
    };
    topProducts: ReportTopProduct[];
    dailyBreakdown: ReportDailySales[];
  };
  expenses: {
    total: number;
    operationalExpenses: number;
    monthlyBillsAmount: number;
    adSpendAmount: number;
    categories: ReportCategoryExpense[];
    monthlyBills: ReportMonthlyBillEntry[];
  };
  capital: {
    totalInvestments: number;
    totalWithdrawals: number;
    totalPayouts: number;
    transactionsCount: number;
  };
  executiveNotes: string[];
}

/**
 * Parses a month string like '2026-10' into year and month numbers.
 */
export function parseMonthString(monthStr: string): { year: number; month: number } {
  const [yearPart, monthPart] = monthStr.split('-');
  const year = parseInt(yearPart, 10);
  const month = parseInt(monthPart, 10);
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    throw new Error(`Invalid month string: "${monthStr}". Expected format YYYY-MM.`);
  }
  return { year, month };
}

/**
 * Returns the month string for the previous calendar month in store timezone.
 * e.g., on Nov 1, 2026 -> returns '2026-10'
 */
export function getPreviousMonthString(referenceDate?: Date): string {
  const parts = getStoreDateParts(referenceDate || new Date());
  let prevYear = parts.year;
  let prevMonth = parts.month - 1;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }
  const paddedMonth = prevMonth < 10 ? `0${prevMonth}` : `${prevMonth}`;
  return `${prevYear}-${paddedMonth}`;
}

/**
 * Formats a release date for a given month.
 * For example: for month '2026-10' (October 2026), the release date is 'November 1, 2026'.
 */
export function getReportReleaseDateString(year: number, month: number): string {
  let nextYear = year;
  let nextMonth = month + 1;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }
  const d = new Date(nextYear, nextMonth - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Compiles a company-level financial report for the specified month (e.g. '2026-10').
 */
export async function compileMonthlyFinancialReport(
  monthStr: string,
  options?: { saveToDb?: boolean; createdById?: string }
): Promise<FinancialReportData> {
  const { year, month } = parseMonthString(monthStr);
  const { startDate, endDate } = getStoreMonthRange(year, month);

  const monthDisplay = new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const reportReleaseDate = getReportReleaseDateString(year, month);

  // 1. Fetch orders in store timezone month range
  const monthOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      totalPrice: orders.totalPrice,
      totalOutstanding: orders.totalOutstanding,
      financialStatus: orders.financialStatus,
      paymentGateway: orders.paymentGateway,
      codStatus: orders.codStatus,
      codCollectedAmount: orders.codCollectedAmount,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(and(gte(orders.createdAt, startDate), lt(orders.createdAt, endDate)))
    .orderBy(desc(orders.createdAt));

  let totalRevenue = 0;
  let prepaidRevenue = 0;
  let prepaidCount = 0;
  let codRevenue = 0;
  let codCount = 0;
  let codCollected = 0;
  let codPending = 0;

  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyMap = new Map<number, { revenue: number; ordersCount: number }>();
  for (let d = 1; d <= daysInMonth; d++) {
    dailyMap.set(d, { revenue: 0, ordersCount: 0 });
  }

  for (const order of monthOrders) {
    const revenue = parseFloat(order.totalPrice || '0') || 0;
    totalRevenue += revenue;

    if (order.createdAt) {
      const day = getStoreDay(order.createdAt);
      if (day >= 1 && day <= daysInMonth) {
        const cur = dailyMap.get(day) || { revenue: 0, ordersCount: 0 };
        dailyMap.set(day, {
          revenue: cur.revenue + revenue,
          ordersCount: cur.ordersCount + 1,
        });
      }
    }

    if (isCodOrder(order)) {
      codCount++;
      const isPartiallyPaid = order.financialStatus === 'partially_paid';
      const codPortion = isPartiallyPaid ? getCodAmountToCollect(order) : revenue;
      const prepaidPortion = isPartiallyPaid ? getPrepaidAmount(order) : 0;

      codRevenue += codPortion;
      prepaidRevenue += prepaidPortion;

      if (order.codStatus === 'COLLECTED') {
        const collected = parseFloat(order.codCollectedAmount || '0') || codPortion;
        codCollected += collected;
      } else {
        codPending += codPortion;
      }
    } else {
      prepaidCount++;
      prepaidRevenue += revenue;
    }
  }

  const totalOrders = monthOrders.length;
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // 2. Fetch Top Selling Products for this month
  const topProductsRaw = await db
    .select({
      title: orderItems.title,
      unitsSold: sql<number>`SUM(CAST(${orderItems.quantity} AS NUMERIC))`,
      totalSales: sql<number>`SUM(CAST(${orderItems.quantity} AS NUMERIC) * CAST(${orderItems.price} AS NUMERIC))`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(gte(orders.createdAt, startDate), lt(orders.createdAt, endDate)))
    .groupBy(orderItems.title)
    .orderBy(desc(sql`SUM(CAST(${orderItems.quantity} AS NUMERIC) * CAST(${orderItems.price} AS NUMERIC))`))
    .limit(10);

  const topProducts: ReportTopProduct[] = topProductsRaw.map((p) => {
    const revenue = Number(p.totalSales || 0);
    return {
      title: p.title || 'Unknown Product',
      quantity: Number(p.unitsSold || 0),
      revenue,
      percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
    };
  });

  // 3. Fetch Operational Expenses in store timezone month range
  const expensesList = await db
    .select({
      id: expenses.id,
      title: expenses.title,
      amount: expenses.amount,
      categoryName: expenseCategories.name,
    })
    .from(expenses)
    .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
    .where(
      and(
        isNull(expenses.deletedAt),
        gte(expenses.expenseDate, startDate),
        lt(expenses.expenseDate, endDate)
      )
    );

  let totalExpenses = 0;
  const categoryMap = new Map<string, { amount: number; count: number }>();

  for (const exp of expensesList) {
    const amt = parseFloat(exp.amount || '0') || 0;
    totalExpenses += amt;
    const cat = exp.categoryName || 'Other';
    const cur = categoryMap.get(cat) || { amount: 0, count: 0 };
    categoryMap.set(cat, {
      amount: cur.amount + amt,
      count: cur.count + 1,
    });
  }

  const categories: ReportCategoryExpense[] = Array.from(categoryMap.entries())
    .map(([catName, val]) => ({
      category: catName,
      amount: Math.round(val.amount * 100) / 100,
      percentage: totalExpenses > 0 ? (val.amount / totalExpenses) * 100 : 0,
      count: val.count,
    }))
    .sort((a, b) => b.amount - a.amount);

  // 4. Monthly Recurring Bills
  const monthlyBillsRaw = await db
    .select({
      name: monthlyExpenseEntries.name,
      category: monthlyExpenseEntries.category,
      expectedAmount: monthlyExpenseEntries.expectedAmount,
      actualAmount: monthlyExpenseEntries.actualAmount,
      status: monthlyExpenseEntries.status,
    })
    .from(monthlyExpenseEntries)
    .where(eq(monthlyExpenseEntries.month, monthStr));

  let monthlyBillsAmount = 0;
  const monthlyBills: ReportMonthlyBillEntry[] = monthlyBillsRaw.map((b) => {
    const actAmt = parseFloat(b.actualAmount || '0') || 0;
    const expAmt = parseFloat(b.expectedAmount || '0') || 0;
    monthlyBillsAmount += actAmt > 0 ? actAmt : expAmt;
    return {
      name: b.name,
      category: b.category,
      expectedAmount: expAmt,
      actualAmount: actAmt,
      status: b.status,
    };
  });

  // 5. Meta Ads Spend in that month
  const [metaAdsSpendResult] = await db
    .select({
      total: sql<number>`COALESCE(SUM(CAST(${metaAdsTransactions.amountPaid} AS NUMERIC)), 0)`,
    })
    .from(metaAdsTransactions)
    .where(
      and(
        gte(metaAdsTransactions.paymentDate, startDate),
        lt(metaAdsTransactions.paymentDate, endDate)
      )
    );
  const adSpendAmount = Number(metaAdsSpendResult?.total || 0);

  // 6. Partner Capital Transactions in that month
  const partnerTxList = await db
    .select({
      type: partnerTransactions.type,
      amount: partnerTransactions.amount,
      status: partnerTransactions.status,
    })
    .from(partnerTransactions)
    .where(
      and(
        gte(partnerTransactions.transactionDate, startDate),
        lt(partnerTransactions.transactionDate, endDate)
      )
    );

  let totalInvestments = 0;
  let totalWithdrawals = 0;
  let totalPayouts = 0;

  for (const tx of partnerTxList) {
    if (tx.status === 'CANCELLED') continue;
    const amt = parseFloat(tx.amount || '0') || 0;
    if (tx.type === 'INVESTMENT') totalInvestments += amt;
    else if (tx.type === 'WITHDRAWAL') totalWithdrawals += amt;
    else if (tx.type === 'PAYOUT' || tx.type === 'PROFIT_SHARE') totalPayouts += amt;
  }

  // 7. Calculate Net Profit and Margins
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // 8. Fetch Prior Month's Metrics for MoM (Month-over-Month) comparison
  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }
  const { startDate: prevStart, endDate: prevEnd } = getStoreMonthRange(prevYear, prevMonth);

  const [prevOrdersResult] = await db
    .select({
      revenue: sql<number>`COALESCE(SUM(CAST(${orders.totalPrice} AS NUMERIC)), 0)`,
      ordersCount: sql<number>`COUNT(*)`,
    })
    .from(orders)
    .where(and(gte(orders.createdAt, prevStart), lt(orders.createdAt, prevEnd)));

  const [prevExpResult] = await db
    .select({
      totalExpense: sql<number>`COALESCE(SUM(CAST(${expenses.amount} AS NUMERIC)), 0)`,
    })
    .from(expenses)
    .where(
      and(
        isNull(expenses.deletedAt),
        gte(expenses.expenseDate, prevStart),
        lt(expenses.expenseDate, prevEnd)
      )
    );

  const prevRevenue = Number(prevOrdersResult?.revenue || 0);
  const prevExpenses = Number(prevExpResult?.totalExpense || 0);
  const prevNetProfit = prevRevenue - prevExpenses;
  const prevOrders = Number(prevOrdersResult?.ordersCount || 0);

  const revenueGrowthPct =
    prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : null;
  const ordersGrowthPct =
    prevOrders > 0 ? ((totalOrders - prevOrders) / prevOrders) * 100 : null;
  const profitGrowthPct =
    prevNetProfit !== 0 ? ((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100 : null;

  // 9. Format Daily Breakdown
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const dailyBreakdown: ReportDailySales[] = Array.from(dailyMap.entries()).map(([d, val]) => ({
    day: d,
    dateStr: `${year}-${pad(month)}-${pad(d)}`,
    revenue: Math.round(val.revenue * 100) / 100,
    ordersCount: val.ordersCount,
  }));

  // 10. Generate Automated Executive Insights
  const executiveNotes: string[] = [];
  executiveNotes.push(
    `Gross sales for ${monthDisplay} totaled ₹${totalRevenue.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
    })} across ${totalOrders} customer orders with an Average Order Value of ₹${aov.toFixed(2)}.`
  );

  if (revenueGrowthPct !== null) {
    const sign = revenueGrowthPct >= 0 ? '+' : '';
    executiveNotes.push(
      `Month-over-Month revenue changed by ${sign}${revenueGrowthPct.toFixed(1)}% compared to the previous month.`
    );
  }

  const marginSign = netProfit >= 0 ? 'profitable' : 'net loss';
  executiveNotes.push(
    `Operating results yielded a ${marginSign} of ₹${Math.abs(netProfit).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
    })} (Net Margin: ${profitMargin.toFixed(1)}%).`
  );

  if (categories.length > 0) {
    const topCat = categories[0];
    executiveNotes.push(
      `Primary operational expenditure driver was "${topCat.category}" at ₹${topCat.amount.toLocaleString(
        'en-IN',
        { minimumFractionDigits: 2 }
      )} (${topCat.percentage.toFixed(1)}% of total expenses).`
    );
  }

  const prepaidShare = totalRevenue > 0 ? (prepaidRevenue / totalRevenue) * 100 : 0;
  const codShare = totalRevenue > 0 ? (codRevenue / totalRevenue) * 100 : 0;
  executiveNotes.push(
    `Payment channel mix: Prepaid orders contributed ${prepaidShare.toFixed(1)}% (₹${prepaidRevenue.toLocaleString(
      'en-IN',
      { minimumFractionDigits: 2 }
    )}), and Cash on Delivery represented ${codShare.toFixed(1)}% (₹${codRevenue.toLocaleString(
      'en-IN',
      { minimumFractionDigits: 2 }
    )}).`
  );

  if (topProducts.length > 0) {
    const topProd = topProducts[0];
    executiveNotes.push(
      `Top performing merchandise was "${topProd.title}" with ${topProd.quantity} units sold generating ₹${topProd.revenue.toLocaleString(
        'en-IN',
        { minimumFractionDigits: 2 }
      )}.`
    );
  }

  const reportId = `rep_${monthStr.replace('-', '_')}`;

  const reportData: FinancialReportData = {
    meta: {
      id: reportId,
      month: monthStr,
      monthDisplay,
      year,
      monthNumber: month,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      reportReleaseDate,
      currency: 'INR',
      status: 'COMPLETED',
      generatedAt: new Date().toISOString(),
    },
    kpis: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      aov: Math.round(aov * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      profitMargin: Math.round(profitMargin * 10) / 10,
      mom: {
        revenueGrowthPct: revenueGrowthPct !== null ? Math.round(revenueGrowthPct * 10) / 10 : null,
        ordersGrowthPct: ordersGrowthPct !== null ? Math.round(ordersGrowthPct * 10) / 10 : null,
        profitGrowthPct: profitGrowthPct !== null ? Math.round(profitGrowthPct * 10) / 10 : null,
        prevRevenue: Math.round(prevRevenue * 100) / 100,
        prevExpenses: Math.round(prevExpenses * 100) / 100,
        prevNetProfit: Math.round(prevNetProfit * 100) / 100,
        prevOrders,
      },
    },
    sales: {
      prepaid: {
        count: prepaidCount,
        revenue: Math.round(prepaidRevenue * 100) / 100,
        percentage: totalRevenue > 0 ? Math.round((prepaidRevenue / totalRevenue) * 1000) / 10 : 0,
      },
      cod: {
        count: codCount,
        revenue: Math.round(codRevenue * 100) / 100,
        percentage: totalRevenue > 0 ? Math.round((codRevenue / totalRevenue) * 1000) / 10 : 0,
        collectedAmount: Math.round(codCollected * 100) / 100,
        pendingAmount: Math.round(codPending * 100) / 100,
      },
      topProducts,
      dailyBreakdown,
    },
    expenses: {
      total: Math.round(totalExpenses * 100) / 100,
      operationalExpenses: Math.round(totalExpenses * 100) / 100,
      monthlyBillsAmount: Math.round(monthlyBillsAmount * 100) / 100,
      adSpendAmount: Math.round(adSpendAmount * 100) / 100,
      categories,
      monthlyBills,
    },
    capital: {
      totalInvestments: Math.round(totalInvestments * 100) / 100,
      totalWithdrawals: Math.round(totalWithdrawals * 100) / 100,
      totalPayouts: Math.round(totalPayouts * 100) / 100,
      transactionsCount: partnerTxList.length,
    },
    executiveNotes,
  };

  // If saveToDb requested, upsert into monthlyFinancialReports table
  if (options?.saveToDb !== false) {
    await db
      .insert(monthlyFinancialReports)
      .values({
        id: reportId,
        month: monthStr,
        year: year.toString(),
        monthNumber: month.toString(),
        startDate,
        endDate,
        status: 'COMPLETED',
        totalRevenue: reportData.kpis.totalRevenue.toString(),
        totalExpenses: reportData.kpis.totalExpenses.toString(),
        netProfit: reportData.kpis.netProfit.toString(),
        profitMargin: reportData.kpis.profitMargin.toString(),
        totalOrders: reportData.kpis.totalOrders.toString(),
        aov: reportData.kpis.aov.toString(),
        prepaidRevenue: reportData.sales.prepaid.revenue.toString(),
        prepaidOrdersCount: reportData.sales.prepaid.count.toString(),
        codRevenue: reportData.sales.cod.revenue.toString(),
        codOrdersCount: reportData.sales.cod.count.toString(),
        codCollectedAmount: reportData.sales.cod.collectedAmount.toString(),
        codPendingAmount: reportData.sales.cod.pendingAmount.toString(),
        operationalExpenses: reportData.expenses.operationalExpenses.toString(),
        monthlyBillsAmount: reportData.expenses.monthlyBillsAmount.toString(),
        adSpendAmount: reportData.expenses.adSpendAmount.toString(),
        summaryData: JSON.stringify(reportData),
        createdById: options?.createdById || null,
        generatedAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: monthlyFinancialReports.month,
        set: {
          totalRevenue: reportData.kpis.totalRevenue.toString(),
          totalExpenses: reportData.kpis.totalExpenses.toString(),
          netProfit: reportData.kpis.netProfit.toString(),
          profitMargin: reportData.kpis.profitMargin.toString(),
          totalOrders: reportData.kpis.totalOrders.toString(),
          aov: reportData.kpis.aov.toString(),
          prepaidRevenue: reportData.sales.prepaid.revenue.toString(),
          prepaidOrdersCount: reportData.sales.prepaid.count.toString(),
          codRevenue: reportData.sales.cod.revenue.toString(),
          codOrdersCount: reportData.sales.cod.count.toString(),
          codCollectedAmount: reportData.sales.cod.collectedAmount.toString(),
          codPendingAmount: reportData.sales.cod.pendingAmount.toString(),
          operationalExpenses: reportData.expenses.operationalExpenses.toString(),
          monthlyBillsAmount: reportData.expenses.monthlyBillsAmount.toString(),
          adSpendAmount: reportData.expenses.adSpendAmount.toString(),
          summaryData: JSON.stringify(reportData),
          updatedAt: new Date(),
        },
      });
  }

  return reportData;
}

/**
 * Retrieves a monthly report from the database if compiled, or compiles on the fly.
 */
export async function getOrCompileMonthlyReport(
  monthStr: string,
  forceRefresh = false
): Promise<FinancialReportData> {
  if (!forceRefresh) {
    const [existing] = await db
      .select()
      .from(monthlyFinancialReports)
      .where(eq(monthlyFinancialReports.month, monthStr));

    if (existing?.summaryData) {
      try {
        return JSON.parse(existing.summaryData) as FinancialReportData;
      } catch (err) {
        console.warn(`[MonthlyReport] Failed to parse summaryData for ${monthStr}, recompiling...`, err);
      }
    }
  }

  return compileMonthlyFinancialReport(monthStr, { saveToDb: true });
}

/**
 * Lists all generated monthly reports from database and discovers any past closed months
 * that have orders but haven't been compiled yet.
 */
export async function listMonthlyFinancialReports(): Promise<{
  reports: Array<{
    id: string;
    month: string;
    monthDisplay: string;
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    totalOrders: number;
    generatedAt: string;
    emailSentAt: string | null;
    isCompiled: boolean;
  }>;
}> {
  const existingReports = await db
    .select()
    .from(monthlyFinancialReports)
    .orderBy(desc(monthlyFinancialReports.month));

  const existingMap = new Map<string, (typeof existingReports)[0]>();
  for (const r of existingReports) {
    existingMap.set(r.month, r);
  }

  // Also query distinct closed months with orders
  const distinctOrderMonths = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${orders.createdAt} AT TIME ZONE 'Asia/Kolkata'), 'YYYY-MM')`,
    })
    .from(orders)
    .groupBy(sql`date_trunc('month', ${orders.createdAt} AT TIME ZONE 'Asia/Kolkata')`)
    .orderBy(desc(sql`date_trunc('month', ${orders.createdAt} AT TIME ZONE 'Asia/Kolkata')`));

  const allMonthsSet = new Set<string>();
  for (const r of existingReports) {
    allMonthsSet.add(r.month);
  }
  for (const m of distinctOrderMonths) {
    if (m.month) allMonthsSet.add(m.month);
  }

  const sortedMonths = Array.from(allMonthsSet).sort((a, b) => b.localeCompare(a));

  const result = sortedMonths.map((m) => {
    const existing = existingMap.get(m);
    const { year, month } = parseMonthString(m);
    const monthDisplay = new Date(year, month - 1, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    if (existing) {
      return {
        id: existing.id,
        month: m,
        monthDisplay,
        totalRevenue: parseFloat(existing.totalRevenue || '0'),
        totalExpenses: parseFloat(existing.totalExpenses || '0'),
        netProfit: parseFloat(existing.netProfit || '0'),
        profitMargin: parseFloat(existing.profitMargin || '0'),
        totalOrders: parseInt(existing.totalOrders || '0', 10),
        generatedAt: existing.generatedAt ? existing.generatedAt.toISOString() : new Date().toISOString(),
        emailSentAt: existing.emailSentAt ? existing.emailSentAt.toISOString() : null,
        isCompiled: true,
      };
    }

    return {
      id: `rep_${m.replace('-', '_')}`,
      month: m,
      monthDisplay,
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      profitMargin: 0,
      totalOrders: 0,
      generatedAt: new Date().toISOString(),
      emailSentAt: null,
      isCompiled: false,
    };
  });

  return { reports: result };
}

/**
 * Automated Cron Action:
 * When a month ends, on the 1st day of the new month (or if the previous closed month has not been processed),
 * this compiles the report, generates the PDF, and sends an email to company admins.
 */
export async function checkAndGenerateMonthlyReportOnSchedule(forceMonth?: string) {
  const storeNow = getStoreNow();
  const targetMonth = forceMonth || getPreviousMonthString();

  console.log(`[MonthlyReportSchedule] Checking monthly report for ended month: ${targetMonth}. Today is day ${storeNow.day}.`);

  // Check if already generated and emailed
  const [existing] = await db
    .select()
    .from(monthlyFinancialReports)
    .where(eq(monthlyFinancialReports.month, targetMonth));

  const shouldGenerate = forceMonth || !existing || storeNow.day === 1 || !existing.emailSentAt;

  if (!shouldGenerate) {
    return {
      executed: false,
      message: `Report for ${targetMonth} already processed on ${existing?.generatedAt}.`,
      targetMonth,
    };
  }

  // 1. Compile fresh report
  const reportData = await compileMonthlyFinancialReport(targetMonth, { saveToDb: true });

  // 2. Generate PDF Buffer
  const pdfBuffer = await generateFinancialReportPdfBuffer(reportData);

  // 3. Find recipient emails (SUPER_ADMIN and ADMIN users)
  const recipientsRaw = await db
    .select({ email: allowedUsers.email })
    .from(allowedUsers)
    .where(
      sql`${allowedUsers.role} IN ('SUPER_ADMIN', 'ADMIN')`
    );

  const recipientEmails = recipientsRaw.map((r) => r.email).filter(Boolean) as string[];
  if (recipientEmails.length === 0) {
    recipientEmails.push('blactifyofficial@gmail.com');
  }

  // 4. Send Email with PDF attachment
  let emailResult: { success: boolean; error?: string } = { success: false };
  try {
    emailResult = await sendMonthlyReportEmail({
      recipients: recipientEmails,
      reportData,
      pdfBuffer,
    });
  } catch (err: unknown) {
    console.error('[MonthlyReportSchedule] Error delivering email:', err);
    emailResult = {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown email error',
    };
  }

  // 5. Update database with email delivery timestamp
  if (emailResult.success) {
    await db
      .update(monthlyFinancialReports)
      .set({
        emailSentAt: new Date(),
        emailRecipients: JSON.stringify(recipientEmails),
        updatedAt: new Date(),
      })
      .where(eq(monthlyFinancialReports.month, targetMonth));
  }

  return {
    executed: true,
    targetMonth,
    reportData,
    recipients: recipientEmails,
    emailSent: emailResult.success,
    emailError: emailResult.error,
  };
}

