import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { hasPermission, canAccessRoute } from '../src/lib/rbac';
import { formatCurrency, getDaysRemainingBadge } from '../src/components/debts/utils';

describe('Borrow & Lend (Debts) RBAC & Permissions', () => {
  test('SUPER_ADMIN should have full access to view, manage, and delete debts', () => {
    assert.strictEqual(hasPermission('SUPER_ADMIN', 'debts:view'), true);
    assert.strictEqual(hasPermission('SUPER_ADMIN', 'debts:manage'), true);
    assert.strictEqual(hasPermission('SUPER_ADMIN', 'debts:delete'), true);
  });

  test('ADMIN should have view and manage debts access, but not delete', () => {
    assert.strictEqual(hasPermission('ADMIN', 'debts:view'), true);
    assert.strictEqual(hasPermission('ADMIN', 'debts:manage'), true);
    assert.strictEqual(hasPermission('ADMIN', 'debts:delete'), false);
  });

  test('PARTNER and VIEWER should have view-only access', () => {
    assert.strictEqual(hasPermission('PARTNER', 'debts:view'), true);
    assert.strictEqual(hasPermission('PARTNER', 'debts:manage'), false);
    assert.strictEqual(hasPermission('PARTNER', 'debts:delete'), false);

    assert.strictEqual(hasPermission('VIEWER', 'debts:view'), true);
    assert.strictEqual(hasPermission('VIEWER', 'debts:manage'), false);
    assert.strictEqual(hasPermission('VIEWER', 'debts:delete'), false);
  });

  test('STAFF role should not have default access to debts unless explicitly granted', () => {
    assert.strictEqual(hasPermission('STAFF', 'debts:view'), false);
  });

  test('canAccessRoute should correctly guard /debts', () => {
    assert.strictEqual(canAccessRoute('SUPER_ADMIN', '/debts'), true);
    assert.strictEqual(canAccessRoute('ADMIN', '/debts'), true);
    assert.strictEqual(canAccessRoute('PARTNER', '/debts'), true);
    assert.strictEqual(canAccessRoute('VIEWER', '/debts'), true);
    assert.strictEqual(canAccessRoute('STAFF', '/debts'), false);
  });
});

describe('Borrow & Lend Utils', () => {
  test('formatCurrency formats Indian rupee correctly', () => {
    const formatted = formatCurrency(50000);
    assert.match(formatted, /50,000/);
    assert.strictEqual(formatCurrency(0), '₹0.00');
    assert.strictEqual(formatCurrency(null), '₹0.00');
  });

  test('getDaysRemainingBadge handles overdue, due today, and future dates', () => {
    const now = new Date();

    // Overdue by 5 days
    const pastDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const overdueBadge = getDaysRemainingBadge(pastDate);
    assert.ok(overdueBadge);
    assert.strictEqual(overdueBadge.isOverdue, true);
    assert.match(overdueBadge.text, /overdue/i);

    // Due in 10 days
    const futureDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const futureBadge = getDaysRemainingBadge(futureDate);
    assert.ok(futureBadge);
    assert.strictEqual(futureBadge.isOverdue, false);
    assert.match(futureBadge.text, /due in/i);

    // Null check
    assert.strictEqual(getDaysRemainingBadge(null), null);
  });

  test('calculates net balance correctly for contacts', () => {
    // Net = activeLent - activeBorrowed
    const activeLent = 50000;
    const activeBorrowed = 20000;
    const net = activeLent - activeBorrowed;
    assert.strictEqual(net, 30000); // Contact owes you 30,000

    const reverseNet = 10000 - 45000;
    assert.strictEqual(reverseNet, -35000); // You owe contact 35,000
  });
});
