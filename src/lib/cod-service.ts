import { db } from '@/db';
import { orders, codRemittances, paymentMethods, users } from '@/db/schema';
import { sql, eq, desc, and, or, ilike, gte, lt, type AnyColumn } from 'drizzle-orm';
import { getStoreMonthRange, getStoreNow } from '@/lib/date-utils';

export interface CodRemittanceRecord {
  id: string;
  amount: string;
  receivedDate: Date;
  courier: string | null;
  paymentMethodId: string | null;
  paymentMethodName?: string | null;
  referenceNumber: string | null;
  ordersCount: string | null;
  notes: string | null;
  createdById: string | null;
  createdByName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CodOrderBrief {
  id: string;
  orderNumber: string | null;
  customerName: string | null;
  customerEmail: string | null;
  totalPrice: string | null;
  createdAt: Date | null;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  paymentGateway: string | null;
  trackingId: string | null;
  trackingCompany: string | null;
  trackingUrl: string | null;
  courier?: string | null;
}

export interface CodStats {
  totalCodAmount: number;
  totalCodCount: number;
  collectedAmount: number;
  remittanceCount: number;
  pendingAmount: number;
  collectionRate: number;
}

export interface GetCodDashboardParams {
  timeRange?: string; // 'all' | 'this_month' | 'last_30_days' | 'last_month' | 'YYYY-MM'
  month?: string; // optional explicit 'YYYY-MM'
  courier?: string; // courier filter
  search?: string;
}

/**
 * SQL clause that identifies COD orders in line with isCodOrder logic.
 */
export const isCodOrderSql = sql`(
  (
    LOWER(COALESCE(${orders.paymentGateway}, '')) LIKE '%cod%'
    OR LOWER(COALESCE(${orders.paymentGateway}, '')) LIKE '%cash%'
    OR LOWER(COALESCE(${orders.paymentGateway}, '')) LIKE '%manual%'
    OR LOWER(COALESCE(${orders.financialStatus}, '')) IN ('pending', 'partially_paid')
  )
  AND LOWER(COALESCE(${orders.financialStatus}, '')) NOT IN ('voided', 'refunded', 'cancelled', 'canceled')
  AND LOWER(COALESCE(${orders.fulfillmentStatus}, '')) NOT IN ('restocked', 'returned')
  AND CAST(COALESCE(${orders.totalPrice}, '0') AS NUMERIC) > 0
)`;

/**
 * Computes date range boundaries in store timezone.
 */
function buildDateCondition(column: AnyColumn, timeRange: string = 'all', month?: string) {
  const now = getStoreNow();

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split('-').map(Number);
    const range = getStoreMonthRange(y, m);
    return and(gte(column, range.startDate), lt(column, range.endDate));
  }
  if (timeRange === 'this_month') {
    const range = getStoreMonthRange(now.year, now.month);
    return and(gte(column, range.startDate), lt(column, range.endDate));
  }
  if (timeRange === 'last_month') {
    let lastMonth = now.month - 1;
    let lastYear = now.year;
    if (lastMonth < 1) {
      lastMonth = 12;
      lastYear -= 1;
    }
    const range = getStoreMonthRange(lastYear, lastMonth);
    return and(gte(column, range.startDate), lt(column, range.endDate));
  }
  if (timeRange === 'last_30_days') {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return gte(column, thirtyDaysAgo);
  }
  if (timeRange && /^\d{4}-\d{2}$/.test(timeRange)) {
    const [y, m] = timeRange.split('-').map(Number);
    const range = getStoreMonthRange(y, m);
    return and(gte(column, range.startDate), lt(column, range.endDate));
  }

  return undefined;
}

/**
 * Fetches high-level COD metrics, recorded remittances, and orders.
 */
export async function getCodDashboardData(params: GetCodDashboardParams = {}) {
  const { timeRange = 'all', month, courier, search } = params;

  // 1. Calculate Total COD Orders from Shopify
  const orderDateCondition = buildDateCondition(orders.createdAt, timeRange, month);
  const orderConditions = [isCodOrderSql];
  if (orderDateCondition) orderConditions.push(orderDateCondition);

  const codOrdersRaw = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerName: orders.customerName,
      customerEmail: orders.customerEmail,
      totalPrice: orders.totalPrice,
      createdAt: orders.createdAt,
      financialStatus: orders.financialStatus,
      fulfillmentStatus: orders.fulfillmentStatus,
      paymentGateway: orders.paymentGateway,
      trackingId: orders.trackingId,
      trackingCompany: orders.trackingCompany,
      trackingUrl: orders.trackingUrl,
      courier: orders.courier,
    })
    .from(orders)
    .where(and(...orderConditions))
    .orderBy(desc(orders.createdAt));

  let totalCodAmount = 0;
  const couriersSet = new Set<string>();
  const monthsSet = new Set<string>();

  codOrdersRaw.forEach((o) => {
    const price = parseFloat(o.totalPrice || '0') || 0;
    totalCodAmount += price;

    const c = o.trackingCompany || o.courier;
    if (c && c.trim()) couriersSet.add(c.trim());

    if (o.createdAt) {
      const d = new Date(o.createdAt);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthsSet.add(ym);
    }
  });

  const totalCodCount = codOrdersRaw.length;

  // 2. Fetch Recorded Remittances
  const remittanceDateCondition = buildDateCondition(codRemittances.receivedDate, timeRange, month);
  const remittanceConditions = [];
  if (remittanceDateCondition) remittanceConditions.push(remittanceDateCondition);

  if (courier && courier !== 'ALL') {
    remittanceConditions.push(eq(codRemittances.courier, courier));
  }

  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    remittanceConditions.push(
      or(
        ilike(codRemittances.referenceNumber, q),
        ilike(codRemittances.notes, q),
        ilike(codRemittances.courier, q)
      )!
    );
  }

  const remittanceWhere = remittanceConditions.length > 0 ? and(...remittanceConditions) : undefined;

  const rawRemittances = await db
    .select({
      id: codRemittances.id,
      amount: codRemittances.amount,
      receivedDate: codRemittances.receivedDate,
      courier: codRemittances.courier,
      paymentMethodId: codRemittances.paymentMethodId,
      paymentMethodName: paymentMethods.name,
      referenceNumber: codRemittances.referenceNumber,
      ordersCount: codRemittances.ordersCount,
      notes: codRemittances.notes,
      createdById: codRemittances.createdById,
      createdByName: users.name,
      createdAt: codRemittances.createdAt,
      updatedAt: codRemittances.updatedAt,
    })
    .from(codRemittances)
    .leftJoin(paymentMethods, eq(codRemittances.paymentMethodId, paymentMethods.id))
    .leftJoin(users, eq(codRemittances.createdById, users.id))
    .where(remittanceWhere)
    .orderBy(desc(codRemittances.receivedDate), desc(codRemittances.createdAt));

  let collectedAmount = 0;
  rawRemittances.forEach((r) => {
    const amt = parseFloat(r.amount || '0') || 0;
    collectedAmount += amt;

    if (r.courier && r.courier.trim()) couriersSet.add(r.courier.trim());
    if (r.receivedDate) {
      const d = new Date(r.receivedDate);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthsSet.add(ym);
    }
  });

  const remittanceCount = rawRemittances.length;
  const pendingAmount = Math.max(0, totalCodAmount - collectedAmount);
  const collectionRate = totalCodAmount > 0 
    ? Math.round((collectedAmount / totalCodAmount) * 1000) / 10 
    : 0;

  const stats: CodStats = {
    totalCodAmount: Math.round(totalCodAmount * 100) / 100,
    totalCodCount,
    collectedAmount: Math.round(collectedAmount * 100) / 100,
    remittanceCount,
    pendingAmount: Math.round(pendingAmount * 100) / 100,
    collectionRate,
  };

  // 3. Payment Methods for Dropdowns
  const availablePaymentMethods = await db
    .select({
      id: paymentMethods.id,
      name: paymentMethods.name,
      code: paymentMethods.code,
    })
    .from(paymentMethods)
    .where(eq(paymentMethods.isActive, 'true'))
    .orderBy(paymentMethods.name);

  // Filter orders for display tab if search is provided
  let filteredOrders = codOrdersRaw;
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filteredOrders = codOrdersRaw.filter((o) => {
      const num = (o.orderNumber || '').toLowerCase();
      const name = (o.customerName || '').toLowerCase();
      const track = (o.trackingId || '').toLowerCase();
      const cour = (o.trackingCompany || o.courier || '').toLowerCase();
      return num.includes(q) || name.includes(q) || track.includes(q) || cour.includes(q);
    });
  }

  if (courier && courier !== 'ALL') {
    filteredOrders = filteredOrders.filter(
      (o) => (o.trackingCompany || o.courier || '').toLowerCase() === courier.toLowerCase()
    );
  }

  return {
    stats,
    remittances: rawRemittances,
    orders: filteredOrders,
    paymentMethods: availablePaymentMethods,
    availableCouriers: Array.from(couriersSet).sort(),
    availableMonths: Array.from(monthsSet).sort().reverse(),
  };
}

/**
 * Records a new lump-sum COD payout / remittance.
 */
export async function createCodRemittance(data: {
  amount: number | string;
  receivedDate: Date | string;
  courier?: string | null;
  paymentMethodId?: string | null;
  referenceNumber?: string | null;
  ordersCount?: number | string | null;
  notes?: string | null;
  actorId?: string | null;
}) {
  const id = `cod_remit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const amtNum = typeof data.amount === 'number' ? data.amount : parseFloat(data.amount) || 0;
  if (amtNum <= 0) {
    throw new Error('Please enter a valid amount greater than 0');
  }

  const d = data.receivedDate ? new Date(data.receivedDate) : new Date();

  await db.insert(codRemittances).values({
    id,
    amount: amtNum.toString(),
    receivedDate: d,
    courier: data.courier?.trim() || null,
    paymentMethodId: data.paymentMethodId || null,
    referenceNumber: data.referenceNumber?.trim() || null,
    ordersCount: data.ordersCount ? data.ordersCount.toString() : null,
    notes: data.notes?.trim() || null,
    createdById: data.actorId || null,
  });

  return { success: true, id };
}

/**
 * Updates an existing remittance record.
 */
export async function updateCodRemittance(
  id: string,
  data: {
    amount: number | string;
    receivedDate: Date | string;
    courier?: string | null;
    paymentMethodId?: string | null;
    referenceNumber?: string | null;
    ordersCount?: number | string | null;
    notes?: string | null;
  }
) {
  const amtNum = typeof data.amount === 'number' ? data.amount : parseFloat(data.amount) || 0;
  if (amtNum <= 0) {
    throw new Error('Please enter a valid amount greater than 0');
  }

  const d = data.receivedDate ? new Date(data.receivedDate) : new Date();

  await db
    .update(codRemittances)
    .set({
      amount: amtNum.toString(),
      receivedDate: d,
      courier: data.courier?.trim() || null,
      paymentMethodId: data.paymentMethodId || null,
      referenceNumber: data.referenceNumber?.trim() || null,
      ordersCount: data.ordersCount ? data.ordersCount.toString() : null,
      notes: data.notes?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(codRemittances.id, id));

  return { success: true, id };
}

/**
 * Deletes a remittance record.
 */
export async function deleteCodRemittance(id: string) {
  await db.delete(codRemittances).where(eq(codRemittances.id, id));
  return { success: true, id };
}
