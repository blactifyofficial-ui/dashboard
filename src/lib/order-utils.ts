export interface OrderPaymentInfo {
  paymentGateway?: string | null;
  financialStatus?: string | null;
  fulfillmentStatus?: string | null;
  totalPrice?: string | number | null;
  totalOutstanding?: string | number | null;
}

export function isCodOrder(order: OrderPaymentInfo): boolean {
  const status = (order.financialStatus || '').toLowerCase();
  const fulfillment = (order.fulfillmentStatus || '').toLowerCase();
  const price = typeof order.totalPrice === 'number' 
    ? order.totalPrice 
    : parseFloat(order.totalPrice || '0') || 0;

  // Exclude voided, refunded, cancelled, restocked (returned), or 0-amount orders
  if (['voided', 'refunded', 'cancelled', 'canceled'].includes(status)) {
    return false;
  }
  if (['restocked', 'returned'].includes(fulfillment)) {
    return false;
  }
  if (price <= 0) {
    return false;
  }

  const gateway = (order.paymentGateway || '').toLowerCase();
  if (
    gateway.includes('cod') || 
    gateway.includes('cash on delivery') || 
    gateway.includes('manual') || 
    gateway.includes('cash')
  ) {
    return true;
  }
  if (status === 'pending' || status === 'partially_paid') {
    return true;
  }
  return false;
}

/**
 * Returns the exact COD collection amount (the unpaid balance the courier collects at doorstep).
 * For a partially paid order, this is totalOutstanding (balance).
 * If totalOutstanding is not provided, defaults to totalPrice.
 */
export function getCodAmountToCollect(order: {
  totalPrice?: string | number | null;
  totalOutstanding?: string | number | null;
  financialStatus?: string | null;
}): number {
  const status = (order.financialStatus || '').toLowerCase();
  const totalPrice = typeof order.totalPrice === 'number'
    ? order.totalPrice
    : parseFloat(order.totalPrice || '0') || 0;

  if (order.totalOutstanding !== undefined && order.totalOutstanding !== null && order.totalOutstanding !== '') {
    const outstanding = typeof order.totalOutstanding === 'number'
      ? order.totalOutstanding
      : parseFloat(order.totalOutstanding) || 0;

    if (status === 'partially_paid') {
      return Math.max(0, outstanding);
    }
    if (status === 'paid') {
      return 0;
    }
    if (status === 'pending') {
      return outstanding > 0 ? outstanding : totalPrice;
    }
  }

  return totalPrice;
}

/**
 * Returns the amount already paid in advance online for the order.
 * For partially paid orders: totalPrice - totalOutstanding.
 * For paid orders: totalPrice.
 * For fully pending COD orders: 0.
 */
export function getPrepaidAmount(order: {
  totalPrice?: string | number | null;
  totalOutstanding?: string | number | null;
  financialStatus?: string | null;
}): number {
  const status = (order.financialStatus || '').toLowerCase();
  const totalPrice = typeof order.totalPrice === 'number'
    ? order.totalPrice
    : parseFloat(order.totalPrice || '0') || 0;

  if (status === 'paid') {
    return totalPrice;
  }

  if (status === 'partially_paid') {
    if (order.totalOutstanding !== undefined && order.totalOutstanding !== null && order.totalOutstanding !== '') {
      const outstanding = typeof order.totalOutstanding === 'number'
        ? order.totalOutstanding
        : parseFloat(order.totalOutstanding) || 0;
      return Math.max(0, totalPrice - outstanding);
    }
  }

  return 0;
}

