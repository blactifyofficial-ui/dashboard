export interface OrderPaymentInfo {
  paymentGateway?: string | null;
  financialStatus?: string | null;
  fulfillmentStatus?: string | null;
  totalPrice?: string | number | null;
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
