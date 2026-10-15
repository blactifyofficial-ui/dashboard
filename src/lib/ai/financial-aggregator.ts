import { db } from '@/db';
import { orders, orderItems, expenses, expenseCategories, metaAdsTransactions, monthlyExpenseEntries, partnerTransactions } from '@/db/schema';
import { sql, and, gte, lte, isNull, desc, eq } from 'drizzle-orm';
import { isCodOrder } from '@/lib/order-utils';
import { getStoreDateParts, STORE_TIMEZONE } from '@/lib/date-utils';

export type TimeframeOption = '30d' | '90d' | 'ytd' | 'all';

export interface FinancialSnapshot {
  timeframe: TimeframeOption;
  dateRange: {
    startDate: string;
    endDate: string;
    daysCount: number;
  };
  sales: {
    totalRevenue: number;
    totalOrders: number;
    aov: number;
    prepaidRevenue: number;
    prepaidOrdersCount: number;
    prepaidAov: number;
    codRevenue: number;
    codOrdersCount: number;
    codAov: number;
    codRatioPercent: number;
    fulfillmentRatePercent: number;
    fulfilledOrders: number;
    unfulfilledOrders: number;
    refundedOrdersCount: number;
    topProducts: Array<{
      title: string;
      unitsSold: number;
      revenue: number;
    }>;
  };
  expenses: {
    totalOperationalExpenses: number;
    byCategory: Array<{
      categoryName: string;
      amount: number;
      percentage: number;
    }>;
    topExpenseItems: Array<{
      title: string;
      category: string;
      amount: number;
      date: string;
    }>;
  };
  marketing: {
    totalMetaAdsSpend: number;
    blendedRoas: number;
    blendedCac: number;
    marketingEfficiencyRatioPercent: number;
  };
  monthlyBills: {
    totalExpectedOverhead: number;
    totalActualPaid: number;
    pendingCount: number;
    paidCount: number;
  };
  capitalAndPartners: {
    totalInvestments: number;
    totalPayoutsAndWithdrawals: number;
  };
  profitability: {
    netOperatingIncome: number;
    netMarginPercent: number;
    estimatedDailyBurnOrSurplus: number;
  };
}

export async function aggregateFinancialData(timeframe: TimeframeOption = '30d'): Promise<FinancialSnapshot> {
  const now = new Date();
  let startDate: Date | null = null;
  let daysCount = 30;

  if (timeframe === '30d') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    daysCount = 30;
  } else if (timeframe === '90d') {
    startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    daysCount = 90;
  } else if (timeframe === 'ytd') {
    const parts = getStoreDateParts(now);
    startDate = new Date(`${parts.year}-01-01T00:00:00+05:30`);
    daysCount = Math.max(1, Math.round((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));
  } else {
    // 'all'
    startDate = null;
    daysCount = 365; // baseline scale for daily calculations
  }

  // --- 1. Fetch Orders ---
  const orderWhereConditions = [];
  if (startDate) {
    orderWhereConditions.push(gte(orders.createdAt, startDate));
  }
  orderWhereConditions.push(lte(orders.createdAt, now));

  const rawOrders = await db
    .select({
      id: orders.id,
      totalPrice: orders.totalPrice,
      financialStatus: orders.financialStatus,
      fulfillmentStatus: orders.fulfillmentStatus,
      paymentGateway: orders.paymentGateway,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(orderWhereConditions.length > 0 ? and(...orderWhereConditions) : undefined);

  let totalRevenue = 0;
  let prepaidRevenue = 0;
  let prepaidOrdersCount = 0;
  let codRevenue = 0;
  let codOrdersCount = 0;
  let fulfilledOrders = 0;
  let unfulfilledOrders = 0;
  let refundedOrdersCount = 0;

  for (const o of rawOrders) {
    const price = parseFloat(o.totalPrice || '0') || 0;
    totalRevenue += price;

    const isCod = isCodOrder({
      paymentGateway: o.paymentGateway,
      financialStatus: o.financialStatus,
    });

    if (isCod) {
      codRevenue += price;
      codOrdersCount += 1;
    } else {
      prepaidRevenue += price;
      prepaidOrdersCount += 1;
    }

    const fStatus = (o.fulfillmentStatus || '').toLowerCase();
    if (fStatus === 'fulfilled') {
      fulfilledOrders += 1;
    } else {
      unfulfilledOrders += 1;
    }

    const finStatus = (o.financialStatus || '').toLowerCase();
    if (finStatus === 'refunded' || finStatus === 'partially_refunded') {
      refundedOrdersCount += 1;
    }
  }

  const totalOrders = rawOrders.length;
  const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const prepaidAov = prepaidOrdersCount > 0 ? Math.round(prepaidRevenue / prepaidOrdersCount) : 0;
  const codAov = codOrdersCount > 0 ? Math.round(codRevenue / codOrdersCount) : 0;
  const codRatioPercent = totalOrders > 0 ? Math.round((codOrdersCount / totalOrders) * 100) : 0;
  const fulfillmentRatePercent = totalOrders > 0 ? Math.round((fulfilledOrders / totalOrders) * 100) : 0;

  // --- 2. Top Products ---
  const itemWhere = startDate ? and(gte(orders.createdAt, startDate), lte(orders.createdAt, now)) : undefined;

  const topProductsRaw = await db
    .select({
      title: orderItems.title,
      unitsSold: sql<number>`COALESCE(SUM(CAST(${orderItems.quantity} AS NUMERIC)), 0)`,
      revenue: sql<number>`COALESCE(SUM(CAST(${orderItems.quantity} AS NUMERIC) * CAST(${orderItems.price} AS NUMERIC)), 0)`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(itemWhere)
    .groupBy(orderItems.title)
    .orderBy(desc(sql`SUM(CAST(${orderItems.quantity} AS NUMERIC) * CAST(${orderItems.price} AS NUMERIC))`))
    .limit(10);

  const topProducts = topProductsRaw.map((p) => ({
    title: p.title || 'Unknown Product',
    unitsSold: Number(p.unitsSold) || 0,
    revenue: Math.round(Number(p.revenue) || 0),
  }));

  // --- 3. Operational Expenses ---
  const expenseWhere = [isNull(expenses.deletedAt)];
  if (startDate) {
    expenseWhere.push(gte(expenses.expenseDate, startDate));
  }
  expenseWhere.push(lte(expenses.expenseDate, now));

  const rawExpenses = await db
    .select({
      id: expenses.id,
      title: expenses.title,
      amount: expenses.amount,
      expenseDate: expenses.expenseDate,
      categoryName: expenseCategories.name,
    })
    .from(expenses)
    .innerJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
    .where(and(...expenseWhere))
    .orderBy(desc(sql`CAST(${expenses.amount} AS NUMERIC)`));

  let totalOperationalExpenses = 0;
  const categoryTotals: Record<string, number> = {};

  for (const exp of rawExpenses) {
    const amt = parseFloat(exp.amount || '0') || 0;
    totalOperationalExpenses += amt;
    const cat = exp.categoryName || 'General';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
  }

  const byCategory = Object.entries(categoryTotals)
    .map(([categoryName, amount]) => ({
      categoryName,
      amount: Math.round(amount),
      percentage: totalOperationalExpenses > 0 ? Math.round((amount / totalOperationalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const topExpenseItems = rawExpenses.slice(0, 6).map((e) => ({
    title: e.title,
    category: e.categoryName,
    amount: Math.round(parseFloat(e.amount || '0')),
    date: e.expenseDate ? e.expenseDate.toISOString().split('T')[0] : '',
  }));

  // --- 4. Meta Ads Spend ---
  const adsWhere = [eq(metaAdsTransactions.status, 'PAID')];
  if (startDate) {
    adsWhere.push(gte(metaAdsTransactions.paymentDate, startDate));
  }
  adsWhere.push(lte(metaAdsTransactions.paymentDate, now));

  const adsResult = await db
    .select({
      totalPaid: sql<number>`COALESCE(SUM(CAST(${metaAdsTransactions.amountPaid} AS NUMERIC)), 0)`,
    })
    .from(metaAdsTransactions)
    .where(and(...adsWhere));

  const totalMetaAdsSpend = Math.round(Number(adsResult[0]?.totalPaid) || 0);
  const blendedRoas = totalMetaAdsSpend > 0 ? parseFloat((totalRevenue / totalMetaAdsSpend).toFixed(2)) : 0;
  const blendedCac = totalOrders > 0 && totalMetaAdsSpend > 0 ? Math.round(totalMetaAdsSpend / totalOrders) : 0;
  const marketingEfficiencyRatioPercent =
    totalRevenue > 0 ? parseFloat(((totalMetaAdsSpend / totalRevenue) * 100).toFixed(1)) : 0;

  // --- 5. Monthly Recurring Bills ---
  const currentMonthStr = getStoreDateParts(now).dateStr.substring(0, 7); // 'YYYY-MM'
  const monthlyBillsRaw = await db
    .select({
      expectedAmount: monthlyExpenseEntries.expectedAmount,
      actualAmount: monthlyExpenseEntries.actualAmount,
      status: monthlyExpenseEntries.status,
    })
    .from(monthlyExpenseEntries)
    .where(eq(monthlyExpenseEntries.month, currentMonthStr));

  let totalExpectedOverhead = 0;
  let totalActualPaid = 0;
  let pendingCount = 0;
  let paidCount = 0;

  for (const b of monthlyBillsRaw) {
    totalExpectedOverhead += parseFloat(b.expectedAmount || '0') || 0;
    totalActualPaid += parseFloat(b.actualAmount || '0') || 0;
    if (b.status === 'PAID') paidCount++;
    else pendingCount++;
  }

  // --- 6. Capital & Partner Distributions ---
  const partnerWhere = startDate ? and(gte(partnerTransactions.transactionDate, startDate), lte(partnerTransactions.transactionDate, now)) : undefined;

  const rawPartnerTx = await db
    .select({
      type: partnerTransactions.type,
      amount: partnerTransactions.amount,
      status: partnerTransactions.status,
    })
    .from(partnerTransactions)
    .where(partnerWhere);

  let totalInvestments = 0;
  let totalPayoutsAndWithdrawals = 0;

  for (const tx of rawPartnerTx) {
    if (tx.status === 'CANCELLED') continue;
    const amt = parseFloat(tx.amount || '0') || 0;
    if (tx.type === 'INVESTMENT') {
      totalInvestments += amt;
    } else if (tx.type === 'WITHDRAWAL' || tx.type === 'PAYOUT' || tx.type === 'PROFIT_SHARE') {
      totalPayoutsAndWithdrawals += amt;
    }
  }

  // --- 7. Profitability & Run Rate ---
  const netOperatingIncome = Math.round(totalRevenue - totalOperationalExpenses - totalMetaAdsSpend);
  const netMarginPercent = totalRevenue > 0 ? parseFloat(((netOperatingIncome / totalRevenue) * 100).toFixed(1)) : 0;
  const estimatedDailyBurnOrSurplus = Math.round(netOperatingIncome / daysCount);

  return {
    timeframe,
    dateRange: {
      startDate: startDate ? startDate.toISOString().split('T')[0] : 'Beginning of records',
      endDate: now.toISOString().split('T')[0],
      daysCount,
    },
    sales: {
      totalRevenue: Math.round(totalRevenue),
      totalOrders,
      aov,
      prepaidRevenue: Math.round(prepaidRevenue),
      prepaidOrdersCount,
      prepaidAov,
      codRevenue: Math.round(codRevenue),
      codOrdersCount,
      codAov,
      codRatioPercent,
      fulfillmentRatePercent,
      fulfilledOrders,
      unfulfilledOrders,
      refundedOrdersCount,
      topProducts,
    },
    expenses: {
      totalOperationalExpenses: Math.round(totalOperationalExpenses),
      byCategory,
      topExpenseItems,
    },
    marketing: {
      totalMetaAdsSpend,
      blendedRoas,
      blendedCac,
      marketingEfficiencyRatioPercent,
    },
    monthlyBills: {
      totalExpectedOverhead: Math.round(totalExpectedOverhead),
      totalActualPaid: Math.round(totalActualPaid),
      pendingCount,
      paidCount,
    },
    capitalAndPartners: {
      totalInvestments: Math.round(totalInvestments),
      totalPayoutsAndWithdrawals: Math.round(totalPayoutsAndWithdrawals),
    },
    profitability: {
      netOperatingIncome,
      netMarginPercent,
      estimatedDailyBurnOrSurplus,
    },
  };
}
