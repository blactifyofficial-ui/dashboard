import { UserRole, userRoles } from '@/db/schema';

export const PERMISSIONS = {
  // --- 1. Overview ---
  'overview:view_revenue': ['SUPER_ADMIN', 'ADMIN', 'PARTNER', 'VIEWER'],
  'overview:view_orders': ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'PARTNER', 'VIEWER'],
  'overview:view_status': ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'VIEWER'],
  'overview:view_chart': ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'PARTNER', 'VIEWER'],
  'overview:view_recent_orders': ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'PARTNER', 'VIEWER'],
  'overview:view_top_products': ['SUPER_ADMIN', 'ADMIN', 'PARTNER', 'VIEWER'],

  // --- 2. Revenue & Orders ---
  'revenue:view': ['SUPER_ADMIN', 'ADMIN', 'PARTNER', 'VIEWER'],
  'revenue:view_products': ['SUPER_ADMIN', 'ADMIN', 'PARTNER', 'VIEWER'],
  'orders:view': ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'PARTNER', 'VIEWER'],

  // --- 3. COD Collection ---
  'cod:view': ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'PARTNER', 'VIEWER'],
  'cod:manage': ['SUPER_ADMIN', 'ADMIN', 'STAFF'],
  'cod:export': ['SUPER_ADMIN', 'ADMIN'],
  'cod:delete': ['SUPER_ADMIN'],

  // --- 4. Inventory & Stock ---
  'inventory:view': ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'PARTNER', 'VIEWER'],
  'inventory:view_valuation': ['SUPER_ADMIN', 'ADMIN', 'PARTNER'],
  'inventory:sync': ['SUPER_ADMIN', 'ADMIN', 'STAFF'],
  'inventory:export': ['SUPER_ADMIN', 'ADMIN'],

  // --- 5. Meta Ads ---
  'meta_ads:view': ['SUPER_ADMIN', 'ADMIN', 'PARTNER', 'VIEWER'],
  'meta_ads:manage_planner': ['SUPER_ADMIN', 'ADMIN', 'STAFF'],
  'meta_ads:edit': ['SUPER_ADMIN', 'ADMIN'],
  'meta_ads:delete': ['SUPER_ADMIN'],

  // --- 6. Partners & Capital ---
  'partners:view_all': ['SUPER_ADMIN', 'ADMIN'],
  'partners:view_self': ['SUPER_ADMIN', 'ADMIN', 'PARTNER'],
  'partners:manage_partners': ['SUPER_ADMIN'],
  'partners:record_transaction': ['SUPER_ADMIN', 'ADMIN'],
  'partners:delete_transaction': ['SUPER_ADMIN'],

  // --- 7. Payouts ---
  'payouts:view_all': ['SUPER_ADMIN', 'ADMIN'],
  'payouts:view_self': ['SUPER_ADMIN', 'ADMIN', 'PARTNER'],
  'payouts:manage': ['SUPER_ADMIN'],
  'payouts:delete': ['SUPER_ADMIN'],
  'payouts:mark_paid': ['SUPER_ADMIN', 'ADMIN'],

  // --- 8. Expenses ---
  'expenses:view': ['SUPER_ADMIN', 'ADMIN', 'VIEWER'],
  'expenses:edit': ['SUPER_ADMIN', 'ADMIN'],
  'expenses:delete': ['SUPER_ADMIN'],
  'expenses:manage_notes': ['SUPER_ADMIN', 'ADMIN'],
  'expenses:manage_categories': ['SUPER_ADMIN', 'ADMIN'],

  // --- 9. Monthly Bills ---
  'monthly_expenses:view': ['SUPER_ADMIN', 'ADMIN', 'VIEWER'],
  'monthly_expenses:pay': ['SUPER_ADMIN', 'ADMIN'],
  'monthly_expenses:edit': ['SUPER_ADMIN', 'ADMIN'],
  'monthly_expenses:manage_templates': ['SUPER_ADMIN', 'ADMIN'],
  'monthly_expenses:unlock_month': ['SUPER_ADMIN'],
  'monthly_expenses:sync_sheets': ['SUPER_ADMIN', 'ADMIN'],

  // --- 10. Team & Roles ---
  'team:view': ['SUPER_ADMIN', 'ADMIN'],
  'team:manage_members': ['SUPER_ADMIN'],
  'team:manage_roles': ['SUPER_ADMIN'],

  // --- 11. Settings & Integrations ---
  'settings:view': ['SUPER_ADMIN', 'ADMIN'],
  'settings:sync_orders': ['SUPER_ADMIN', 'ADMIN'],
  'settings:manage_integrations': ['SUPER_ADMIN'],
  'settings:manage_users': ['SUPER_ADMIN'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export type PermissionCategory =
  | 'Overview'
  | 'Revenue & Orders'
  | 'COD Collection'
  | 'Inventory & Stock'
  | 'Meta Ads'
  | 'Partners & Capital'
  | 'Payouts'
  | 'Expenses'
  | 'Monthly Bills'
  | 'Team & Roles'
  | 'Settings & Integrations';

export interface PermissionItem {
  key: Permission;
  label: string;
  description: string;
  category: PermissionCategory;
}

export const PERMISSION_CATALOG: PermissionItem[] = [
  // 1. Overview
  { key: 'overview:view_revenue', label: 'View Revenue & Profits', description: 'See Total Revenue, Net Profit, and Margin on Overview', category: 'Overview' },
  { key: 'overview:view_orders', label: 'View Total Orders', description: 'See order volume counts and high-level order volume KPIs', category: 'Overview' },
  { key: 'overview:view_status', label: 'View Order Status', description: 'See payment channel, delivery fulfillment, and return breakdowns', category: 'Overview' },
  { key: 'overview:view_chart', label: 'View Sales Trend Chart', description: 'Access interactive daily sales curve and volume trend graph', category: 'Overview' },
  { key: 'overview:view_recent_orders', label: 'View Recent Orders Live Feed', description: 'Access the real-time incoming orders live feed widget', category: 'Overview' },
  { key: 'overview:view_top_products', label: 'View Top Selling Products', description: 'See ranking of best-selling products, volume sold, and revenue', category: 'Overview' },

  // 2. Revenue & Orders
  { key: 'revenue:view', label: 'View Revenue Analytics', description: 'Access revenue metrics, gross profit, and monthly performance ledger', category: 'Revenue & Orders' },
  { key: 'revenue:view_products', label: 'View Product Performance', description: 'Access catalog product-level sales and revenue breakdown tab', category: 'Revenue & Orders' },
  { key: 'orders:view', label: 'View Order Details & Customer Info', description: 'Open order detail pages, customer contacts, line items, and tracking info', category: 'Revenue & Orders' },

  // 3. COD Collection
  { key: 'cod:view', label: 'View COD Collections', description: 'Access Cash on Delivery ledger and courier remittance overview', category: 'COD Collection' },
  { key: 'cod:manage', label: 'Record & Reconcile COD', description: 'Record received courier payouts, enter remittance refs, and reconcile orders', category: 'COD Collection' },
  { key: 'cod:export', label: 'Export COD Reports (CSV)', description: 'Download CSV export files of remittance ledgers and COD orders', category: 'COD Collection' },
  { key: 'cod:delete', label: 'Delete COD Remittances', description: 'Permanently remove historical courier remittance payment records', category: 'COD Collection' },

  // 4. Inventory & Stock
  { key: 'inventory:view', label: 'View Inventory & Stock', description: 'Browse stock levels, variant sizes, SKUs, and product items', category: 'Inventory & Stock' },
  { key: 'inventory:view_valuation', label: 'View Inventory Valuation', description: 'See retail inventory value, MRP discount spread, and unit prices', category: 'Inventory & Stock' },
  { key: 'inventory:sync', label: 'Sync Inventory with Shopify', description: 'Trigger manual inventory replenishment and stock count sync', category: 'Inventory & Stock' },
  { key: 'inventory:export', label: 'Export Inventory Reports', description: 'Download inventory stock level and catalog valuation reports', category: 'Inventory & Stock' },

  // 5. Meta Ads
  { key: 'meta_ads:view', label: 'View Meta Ads & Budgets', description: 'See ad spend analytics, daily campaign planner, and weekly budgets', category: 'Meta Ads' },
  { key: 'meta_ads:manage_planner', label: 'Manage Daily Campaign Planner', description: 'Configure daily campaigns, distribute budgets, and update execution status', category: 'Meta Ads' },
  { key: 'meta_ads:edit', label: 'Configure Budgets & Record Payments', description: 'Set weekly/daily ad budgets and log ad spend transactions', category: 'Meta Ads' },
  { key: 'meta_ads:delete', label: 'Delete Ad Payment Records', description: 'Permanently remove ad spend payment transactions and billing records', category: 'Meta Ads' },

  // 6. Partners & Capital
  { key: 'partners:view_all', label: 'View All Partners & Cap Table', description: 'Access full list of equity partners, cap table, and balances', category: 'Partners & Capital' },
  { key: 'partners:view_self', label: 'View Own Partner Stats', description: 'Access partner dashboard (strictly filtered to own profile)', category: 'Partners & Capital' },
  { key: 'partners:manage_partners', label: 'Manage Partner Profiles', description: 'Create, update, or deactivate partner profiles and equity share %', category: 'Partners & Capital' },
  { key: 'partners:record_transaction', label: 'Record Financial Transactions', description: 'Add investment, withdrawal, profit share, or adjustment transactions', category: 'Partners & Capital' },
  { key: 'partners:delete_transaction', label: 'Delete Financial Transactions', description: 'Permanently remove partner capital and financial transactions', category: 'Partners & Capital' },

  // 7. Payouts
  { key: 'payouts:view_all', label: 'View All Payouts', description: 'View full history of all partner distributions and disbursements', category: 'Payouts' },
  { key: 'payouts:view_self', label: 'View Own Payout Records', description: 'See payouts belonging strictly to the user’s partner profile', category: 'Payouts' },
  { key: 'payouts:manage', label: 'Record & Manage Payouts', description: 'Create and edit partner payout distributions and disbursement vouchers', category: 'Payouts' },
  { key: 'payouts:delete', label: 'Delete Payout Records', description: 'Permanently remove recorded partner payout disbursements', category: 'Payouts' },
  { key: 'payouts:mark_paid', label: 'Mark Payouts as Paid', description: 'Update status of pending payout records to completed', category: 'Payouts' },

  // 8. Expenses
  { key: 'expenses:view', label: 'View Daily Expenses', description: 'See daily expense logs, categories, receipts, and summaries', category: 'Expenses' },
  { key: 'expenses:edit', label: 'Create & Edit Expenses', description: 'Add, update, or edit expense records, amounts, and dates', category: 'Expenses' },
  { key: 'expenses:delete', label: 'Delete Expense Records', description: 'Permanently delete or void business expense records', category: 'Expenses' },
  { key: 'expenses:manage_notes', label: 'Manage Daily Context Notes', description: 'Add, edit, or remove context notes on daily expense groups', category: 'Expenses' },
  { key: 'expenses:manage_categories', label: 'Manage Expense Categories', description: 'Create, rename, or delete business expense categories', category: 'Expenses' },

  // 9. Monthly Bills
  { key: 'monthly_expenses:view', label: 'View Monthly Bills', description: 'Access monthly recurring bills, progress bar, and budget caps', category: 'Monthly Bills' },
  { key: 'monthly_expenses:pay', label: 'Record Bill Payments', description: 'Mark recurring bills as paid, enter actual amounts, and log references', category: 'Monthly Bills' },
  { key: 'monthly_expenses:edit', label: 'Add & Edit Monthly Bills', description: 'Create, edit, or delete bill entries in monthly tracking lists', category: 'Monthly Bills' },
  { key: 'monthly_expenses:manage_templates', label: 'Manage Bill Templates', description: 'Configure recurring bill definitions that generate each month', category: 'Monthly Bills' },
  { key: 'monthly_expenses:unlock_month', label: 'Unlock Past Billing Months', description: 'Security override to unlock historical billing months for editing', category: 'Monthly Bills' },
  { key: 'monthly_expenses:sync_sheets', label: 'Sync Bills to Google Sheets', description: 'Trigger Google Sheets synchronization for monthly bills', category: 'Monthly Bills' },

  // 10. Team & Roles
  { key: 'team:view', label: 'View Team & Roles', description: 'Access Team & Roles page and view members, roles, and status', category: 'Team & Roles' },
  { key: 'team:manage_members', label: 'Invite & Manage Members', description: 'Invite users, update roles, assign partner links, and remove members', category: 'Team & Roles' },
  { key: 'team:manage_roles', label: 'Manage RBAC Roles', description: 'Create, configure, edit permissions, and delete custom RBAC roles', category: 'Team & Roles' },

  // 11. Settings & Integrations
  { key: 'settings:view', label: 'View Settings & Appearance', description: 'Access settings page, system configuration, and theme preferences', category: 'Settings & Integrations' },
  { key: 'settings:sync_orders', label: 'Trigger Manual Shopify Sync', description: 'Trigger manual synchronization of Shopify orders and customers', category: 'Settings & Integrations' },
  { key: 'settings:manage_integrations', label: 'Manage Integrations', description: 'Authorize Shopify OAuth app and configure Google Sheets backup sync', category: 'Settings & Integrations' },
  { key: 'settings:manage_users', label: 'Manage Team & Roles (Legacy)', description: 'Legacy compatibility key for managing users and roles', category: 'Settings & Integrations' },
];

export const ROLE_COLOR_PALETTES: Record<string, { badge: string; bg: string; text: string; border: string }> = {
  purple: {
    badge: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
    bg: 'bg-purple-500/10',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-500/30',
  },
  blue: {
    badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
    bg: 'bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-500/30',
  },
  emerald: {
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-500/30',
  },
  amber: {
    badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    bg: 'bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-500/30',
  },
  rose: {
    badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
    bg: 'bg-rose-500/10',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-500/30',
  },
  cyan: {
    badge: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-500/30',
  },
  indigo: {
    badge: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-500/30',
  },
  neutral: {
    badge: 'bg-muted text-foreground border-border',
    bg: 'bg-muted',
    text: 'text-foreground',
    border: 'border-border',
  },
};

export function isSystemRole(role: string): boolean {
  return (userRoles as readonly string[]).includes(role);
}

/**
 * Checks if a given role possesses a specific permission.
 * If customPermissions is supplied (for custom roles), it checks against the explicit permissions list.
 */
export function hasPermission(
  role: UserRole | string | undefined | null,
  permission: Permission,
  customPermissions?: readonly string[]
): boolean {
  if (!role) return false;
  if (role === 'SUPER_ADMIN') return true;

  if (customPermissions && Array.isArray(customPermissions)) {
    if (customPermissions.includes(permission)) return true;
    // Root view permissions: having ANY permission in a page grants viewing that page
    if (permission === 'monthly_expenses:view' && customPermissions.some((p) => p.startsWith('monthly_expenses:'))) {
      return true;
    }
    if (permission === 'expenses:view' && customPermissions.some((p) => p.startsWith('expenses:'))) {
      return true;
    }
    if (permission === 'cod:view' && customPermissions.some((p) => p.startsWith('cod:'))) {
      return true;
    }
    if (permission === 'inventory:view' && customPermissions.some((p) => p.startsWith('inventory:'))) {
      return true;
    }
    if (permission === 'meta_ads:view' && customPermissions.some((p) => p.startsWith('meta_ads:'))) {
      return true;
    }
    if (permission === 'partners:view_self' && customPermissions.some((p) => p.startsWith('partners:'))) {
      return true;
    }
    if (permission === 'payouts:view_self' && customPermissions.some((p) => p.startsWith('payouts:'))) {
      return true;
    }
    if (permission === 'settings:view' && customPermissions.some((p) => p.startsWith('settings:'))) {
      return true;
    }
    if (permission === 'team:view' && (customPermissions.some((p) => p.startsWith('team:')) || customPermissions.includes('settings:manage_users'))) {
      return true;
    }
    // Legacy database migration alias: if a custom role stored legacy settings:manage_users
    if ((permission === 'team:view' || permission === 'team:manage_members' || permission === 'team:manage_roles') && customPermissions.includes('settings:manage_users')) {
      return true;
    }
    return false;
  }

  const allowedRoles = PERMISSIONS[permission] as readonly string[] | undefined;
  if (allowedRoles && allowedRoles.includes(role)) {
    return true;
  }

  // Fallback checks for system roles
  if (permission === 'team:view' && hasPermission(role, 'settings:manage_users')) return true;
  if (permission === 'team:manage_members' && hasPermission(role, 'settings:manage_users')) return true;
  if (permission === 'team:manage_roles' && hasPermission(role, 'settings:manage_users')) return true;
  if (permission === 'orders:view' && hasPermission(role, 'revenue:view')) return true;
  if (permission === 'meta_ads:view' && hasPermission(role, 'meta_ads:manage_planner')) return true;
  if (permission === 'monthly_expenses:view' && hasPermission(role, 'monthly_expenses:edit')) return true;
  if (permission === 'expenses:view' && hasPermission(role, 'expenses:edit')) return true;
  if (permission === 'cod:view' && hasPermission(role, 'cod:manage')) return true;
  if (permission === 'inventory:view' && hasPermission(role, 'inventory:sync')) return true;

  return false;
}

/**
 * Route-level primary permission mapping.
 */
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  '/dashboard': 'overview:view_orders',
  '/revenue': 'revenue:view',
  '/orders': 'orders:view',
  '/cod': 'cod:view',
  '/inventory': 'inventory:view',
  '/meta-ads': 'meta_ads:view',
  '/partners': 'partners:view_self',
  '/payouts': 'payouts:view_self',
  '/expenses': 'expenses:view',
  '/monthly-expenses': 'monthly_expenses:view',
  '/team': 'team:view',
  '/settings': 'settings:view',
};

/**
 * Permissions required/associated with each top-level dashboard page / route.
 * If a role has ANY permission in this list for a page, the page title is shown
 * in the sidebar and the user is granted view access to navigate to it.
 */
export const PAGE_PERMISSIONS: Record<string, readonly Permission[]> = {
  '/dashboard': [
    'overview:view_orders',
    'overview:view_revenue',
    'overview:view_status',
    'overview:view_chart',
    'overview:view_recent_orders',
    'overview:view_top_products',
  ],
  '/revenue': [
    'revenue:view',
    'revenue:view_products',
  ],
  '/orders': [
    'orders:view',
  ],
  '/cod': [
    'cod:view',
    'cod:manage',
    'cod:export',
    'cod:delete',
  ],
  '/inventory': [
    'inventory:view',
    'inventory:view_valuation',
    'inventory:sync',
    'inventory:export',
  ],
  '/meta-ads': [
    'meta_ads:view',
    'meta_ads:manage_planner',
    'meta_ads:edit',
    'meta_ads:delete',
  ],
  '/partners': [
    'partners:view_self',
    'partners:view_all',
    'partners:manage_partners',
    'partners:record_transaction',
    'partners:delete_transaction',
  ],
  '/payouts': [
    'payouts:view_self',
    'payouts:view_all',
    'payouts:manage',
    'payouts:delete',
    'payouts:mark_paid',
  ],
  '/expenses': [
    'expenses:view',
    'expenses:edit',
    'expenses:delete',
    'expenses:manage_notes',
    'expenses:manage_categories',
  ],
  '/monthly-expenses': [
    'monthly_expenses:view',
    'monthly_expenses:pay',
    'monthly_expenses:edit',
    'monthly_expenses:manage_templates',
    'monthly_expenses:unlock_month',
    'monthly_expenses:sync_sheets',
  ],
  '/team': [
    'team:view',
    'team:manage_members',
    'team:manage_roles',
  ],
  '/settings': [
    'settings:view',
    'settings:sync_orders',
    'settings:manage_integrations',
    'settings:manage_users',
  ],
};

/**
 * Checks if a role can access a specific route pathname.
 */
export function canAccessRoute(
  role: UserRole | string | undefined | null,
  pathname: string,
  customPermissions?: readonly string[]
): boolean {
  if (!role) return false;
  if (role === 'SUPER_ADMIN') return true;

  const cleanPath = pathname.split('?')[0].split('#')[0];

  // Match prefix against PAGE_PERMISSIONS
  for (const [route, permissions] of Object.entries(PAGE_PERMISSIONS)) {
    if (cleanPath === route || (route !== '/' && cleanPath.startsWith(route + '/'))) {
      return permissions.some((permission) =>
        hasPermission(role, permission, customPermissions)
      );
    }
  }

  // Fallback to ROUTE_PERMISSIONS
  for (const [route, permission] of Object.entries(ROUTE_PERMISSIONS)) {
    if (cleanPath === route || (route !== '/' && cleanPath.startsWith(route + '/'))) {
      return hasPermission(role, permission, customPermissions);
    }
  }
  return true;
}

export const DEFAULT_ROUTE_ORDER = [
  '/dashboard',
  '/revenue',
  '/cod',
  '/inventory',
  '/meta-ads',
  '/partners',
  '/payouts',
  '/expenses',
  '/monthly-expenses',
  '/team',
  '/settings',
] as const;

/**
 * Returns the first route that a user role has permission to access.
 */
export function getDefaultRouteForUser(
  role: UserRole | string | undefined | null,
  customPermissions?: readonly string[]
): string {
  if (!role) return '/login';
  if (role === 'SUPER_ADMIN') return '/dashboard';

  for (const route of DEFAULT_ROUTE_ORDER) {
    if (canAccessRoute(role, route, customPermissions)) {
      return route;
    }
  }

  return '/dashboard';
}

