import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  hasPermission, 
  canAccessRoute, 
  getDefaultRouteForUser 
} from '../src/lib/rbac';

describe('RBAC & Permission Control Engine', () => {
  describe('System Roles', () => {
    it('SUPER_ADMIN should have universal permission to all actions', () => {
      assert.strictEqual(hasPermission('SUPER_ADMIN', 'overview:view_revenue'), true);
      assert.strictEqual(hasPermission('SUPER_ADMIN', 'expenses:delete'), true);
      assert.strictEqual(hasPermission('SUPER_ADMIN', 'team:manage_roles'), true);
      assert.strictEqual(hasPermission('SUPER_ADMIN', 'cod:delete'), true);
    });

    it('VIEWER should have read-only access and no delete/edit permissions', () => {
      assert.strictEqual(hasPermission('VIEWER', 'overview:view_revenue'), true);
      assert.strictEqual(hasPermission('VIEWER', 'expenses:view'), true);
      assert.strictEqual(hasPermission('VIEWER', 'expenses:edit'), false);
      assert.strictEqual(hasPermission('VIEWER', 'expenses:delete'), false);
      assert.strictEqual(hasPermission('VIEWER', 'team:manage_members'), false);
    });

    it('STAFF should have operational access but no equity or admin controls', () => {
      assert.strictEqual(hasPermission('STAFF', 'overview:view_orders'), true);
      assert.strictEqual(hasPermission('STAFF', 'cod:manage'), true);
      assert.strictEqual(hasPermission('STAFF', 'partners:manage_partners'), false);
      assert.strictEqual(hasPermission('STAFF', 'team:manage_roles'), false);
    });
  });

  describe('Custom Roles & Granular Overrides', () => {
    it('should grant only explicit permissions specified in customPermissions array', () => {
      const customRolePerms = ['inventory:view', 'meta_ads:view', 'meta_ads:manage_planner'];
      
      assert.strictEqual(hasPermission('CUSTOM_MEDIA_BUYER', 'meta_ads:view', customRolePerms), true);
      assert.strictEqual(hasPermission('CUSTOM_MEDIA_BUYER', 'meta_ads:manage_planner', customRolePerms), true);
      assert.strictEqual(hasPermission('CUSTOM_MEDIA_BUYER', 'meta_ads:delete', customRolePerms), false);
      assert.strictEqual(hasPermission('CUSTOM_MEDIA_BUYER', 'expenses:view', customRolePerms), false);
    });

    it('should NOT leak revenue:view when only revenue:view_products is granted', () => {
      const productOnlyPerms = ['revenue:view_products'];
      assert.strictEqual(hasPermission('PRODUCT_MANAGER', 'revenue:view_products', productOnlyPerms), true);
      assert.strictEqual(hasPermission('PRODUCT_MANAGER', 'revenue:view', productOnlyPerms), false);
    });

    it('should NOT grant monthly revenue ledger (revenue:view) when role only has overview:view_revenue', () => {
      const overviewOnlyPerms = ['overview:view_revenue'];
      assert.strictEqual(hasPermission('SALES_REP', 'overview:view_revenue', overviewOnlyPerms), true);
      assert.strictEqual(hasPermission('SALES_REP', 'revenue:view', overviewOnlyPerms), false);
    });

    it('should NOT leak expenses:delete when only expenses:edit is granted', () => {
      const expenseEditorPerms = ['expenses:edit'];
      assert.strictEqual(hasPermission('EXPENSE_CLERK', 'expenses:edit', expenseEditorPerms), true);
      assert.strictEqual(hasPermission('EXPENSE_CLERK', 'expenses:view', expenseEditorPerms), true);
      assert.strictEqual(hasPermission('EXPENSE_CLERK', 'expenses:delete', expenseEditorPerms), false);
      assert.strictEqual(hasPermission('EXPENSE_CLERK', 'expenses:manage_notes', expenseEditorPerms), false);
    });

    it('should NOT leak cod:export when only cod:view is granted', () => {
      const codViewerPerms = ['cod:view'];
      assert.strictEqual(hasPermission('COD_VIEWER', 'cod:view', codViewerPerms), true);
      assert.strictEqual(hasPermission('COD_VIEWER', 'cod:export', codViewerPerms), false);
      assert.strictEqual(hasPermission('COD_VIEWER', 'cod:delete', codViewerPerms), false);
    });

    it('should grant base page view access when ANY sub-permission of that module is granted', () => {
      assert.strictEqual(hasPermission('BILL_PAYER', 'monthly_expenses:view', ['monthly_expenses:pay']), true);
      assert.strictEqual(hasPermission('STOCK_KEEPER', 'inventory:view', ['inventory:sync']), true);
      assert.strictEqual(hasPermission('AD_PLANNER', 'meta_ads:view', ['meta_ads:manage_planner']), true);
    });
  });

  describe('Route Access Guard (canAccessRoute)', () => {
    it('should allow access to sub-routes with trailing paths', () => {
      const perms = ['expenses:view'];
      assert.strictEqual(canAccessRoute('TEST_ROLE', '/expenses', perms), true);
      assert.strictEqual(canAccessRoute('TEST_ROLE', '/expenses/add', perms), true);
      assert.strictEqual(canAccessRoute('TEST_ROLE', '/expenses/exp_123', perms), true);
    });

    it('should NOT falsely match prefix on distinct routes (e.g. /monthly-expenses vs /expenses)', () => {
      const monthlyOnlyPerms = ['monthly_expenses:view'];
      assert.strictEqual(canAccessRoute('TEST_ROLE', '/monthly-expenses', monthlyOnlyPerms), true);
      assert.strictEqual(canAccessRoute('TEST_ROLE', '/expenses', monthlyOnlyPerms), false);
    });

    it('should allow route access if any PAGE_PERMISSIONS are matched', () => {
      const productOnlyPerms = ['revenue:view_products'];
      assert.strictEqual(canAccessRoute('TEST_ROLE', '/revenue', productOnlyPerms), true);
      assert.strictEqual(canAccessRoute('TEST_ROLE', '/revenue?tab=products', productOnlyPerms), true);
    });

    it('should deny route access if user has no permissions in the module', () => {
      const codOnlyPerms = ['cod:view'];
      assert.strictEqual(canAccessRoute('TEST_ROLE', '/revenue', codOnlyPerms), false);
      assert.strictEqual(canAccessRoute('TEST_ROLE', '/meta-ads', codOnlyPerms), false);
      assert.strictEqual(canAccessRoute('TEST_ROLE', '/team', codOnlyPerms), false);
    });
  });

  describe('Intelligent Default Route Fallback (getDefaultRouteForUser)', () => {
    it('SUPER_ADMIN defaults to /dashboard', () => {
      assert.strictEqual(getDefaultRouteForUser('SUPER_ADMIN'), '/dashboard');
    });

    it('unauthenticated user defaults to /login', () => {
      assert.strictEqual(getDefaultRouteForUser(null), '/login');
      assert.strictEqual(getDefaultRouteForUser(undefined), '/login');
    });

    it('role with only Meta Ads and Inventory permissions routes to /inventory or /meta-ads', () => {
      const adsManagerPerms = ['meta_ads:view', 'inventory:view'];
      const defaultRoute = getDefaultRouteForUser('ADS_MANAGER', adsManagerPerms);
      assert.strictEqual(defaultRoute, '/inventory');
    });

    it('role with only COD permissions routes to /cod', () => {
      const codPerms = ['cod:view'];
      const defaultRoute = getDefaultRouteForUser('COD_AGENT', codPerms);
      assert.strictEqual(defaultRoute, '/cod');
    });
  });
});
