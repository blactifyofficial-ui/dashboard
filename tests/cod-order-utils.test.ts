import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isCodOrder, getCodAmountToCollect, getPrepaidAmount } from '../src/lib/order-utils';

describe('COD Order Calculation & Partial Payment Utils', () => {
  it('should identify partially_paid orders as COD', () => {
    const order = {
      financialStatus: 'partially_paid',
      totalPrice: '599.10',
      totalOutstanding: '449.10',
      paymentGateway: 'All-in-one Razorpay Payment Gateway',
    };
    assert.equal(isCodOrder(order), true);
  });

  it('should identify gateway with COD / Cash as COD', () => {
    const order = {
      financialStatus: 'pending',
      totalPrice: '500.00',
      paymentGateway: 'Cash on Delivery (COD)',
    };
    assert.equal(isCodOrder(order), true);
  });

  it('should NOT identify fully paid prepaid orders as COD', () => {
    const order = {
      financialStatus: 'paid',
      totalPrice: '899.10',
      paymentGateway: 'Razorpay',
    };
    assert.equal(isCodOrder(order), false);
  });

  it('should calculate remaining balance as COD amount to collect for partially paid orders', () => {
    const order = {
      financialStatus: 'partially_paid',
      totalPrice: '599.10',
      totalOutstanding: '449.10',
    };
    assert.equal(getCodAmountToCollect(order), 449.1);
    assert.equal(getPrepaidAmount(order), 150);
  });

  it('should return full price for standard pending COD orders without partial payment', () => {
    const order = {
      financialStatus: 'pending',
      totalPrice: '1299.00',
      totalOutstanding: '1299.00',
    };
    assert.equal(getCodAmountToCollect(order), 1299.0);
    assert.equal(getPrepaidAmount(order), 0);
  });

  it('should return 0 COD to collect for fully paid orders', () => {
    const order = {
      financialStatus: 'paid',
      totalPrice: '1299.00',
      totalOutstanding: '0.00',
    };
    assert.equal(getCodAmountToCollect(order), 0);
    assert.equal(getPrepaidAmount(order), 1299.0);
  });

  it('should gracefully fallback to totalPrice if totalOutstanding is not yet provided', () => {
    const order = {
      financialStatus: 'partially_paid',
      totalPrice: '599.10',
    };
    // If totalOutstanding is absent, fallback to totalPrice
    assert.equal(getCodAmountToCollect(order), 599.1);
  });
});
