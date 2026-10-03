export interface OrderPaymentInfo {
  paymentGateway?: string | null;
  financialStatus?: string | null;
}

export function isCodOrder(order: OrderPaymentInfo): boolean {
  const gateway = (order.paymentGateway || '').toLowerCase();
  const status = (order.financialStatus || '').toLowerCase();
  
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
