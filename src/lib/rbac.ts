import { UserRole, userRoles } from '@/db/schema';

export const PERMISSIONS = {
  // --- Overview ---
  'overview:view_revenue': ['SUPER_ADMIN', 'ADMIN', 'PARTNER', 'VIEWER'],
  'overview:view_orders': ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'PARTNER', 'VIEWER'],
  'overview:view_status': ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'VIEWER'],
  'overview:view_chart': ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'PARTNER', 'VIEWER'],

  // --- Revenue Page ---
  'revenue:view': ['SUPER_ADMIN', 'ADMIN', 'PARTNER', 'VIEWER'],

  // --- Inventory Page ---
  'inventory:view': ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'PARTNER', 'VIEWER'],
  'inventory:view_valuation': ['SUPER_ADMIN', 'ADMIN', 'PARTNER'],
  'inventory:sync': ['SUPER_ADMIN', 'ADMIN', 'STAFF'],

  // --- Meta Ads ---
  'meta_ads:view': ['SUPER_ADMIN', 'ADMIN', 'PARTNER', 'VIEWER'],
  'meta_ads:edit': ['SUPER_ADMIN', 'ADMIN'],
  'meta_ads:manage_planner': ['SUPER_ADMIN', 'ADMIN', 'STAFF'],

  // --- Partners ---
  'partners:view_all': ['SUPER_ADMIN', 'ADMIN'],
  'partners:view_self': ['SUPER_ADMIN', 'ADMIN', 'PARTNER'],
  'partners:manage_partners': ['SUPER_ADMIN'],
  'partners:record_transaction': ['SUPER_ADMIN', 'ADMIN'],
  'partners:delete_transaction': ['SUPER_ADMIN'],

  // --- Payouts ---
  'payouts:view_all': ['SUPER_ADMIN', 'ADMIN'],
  'payouts:view_self': ['SUPER_ADMIN', 'ADMIN', 'PARTNER'],
  'payouts:manage': ['SUPER_ADMIN'],
  'payouts:mark_paid': ['SUPER_ADMIN', 'ADMIN'],

  // --- Issues ---
  'issues:view': ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'VIEWER'],
  'issues:create': ['SUPER_ADMIN', 'ADMIN', 'STAFF'],
  'issues:edit': ['SUPER_ADMIN', 'ADMIN', 'STAFF'],
  'issues:delete': ['SUPER_ADMIN', 'ADMIN'],
  'issues:manage_categories': ['SUPER_ADMIN', 'ADMIN'],

  // --- Expenses ---
  'expenses:view': ['SUPER_ADMIN', 'ADMIN', 'VIEWER'],
  'expenses:edit': ['SUPER_ADMIN', 'ADMIN'],

  // --- Monthly Bills ---
  'monthly_expenses:view': ['SUPER_ADMIN', 'ADMIN', 'VIEWER'],
  'monthly_expenses:edit': ['SUPER_ADMIN', 'ADMIN'],
  'monthly_expenses:sync_sheets': ['SUPER_ADMIN', 'ADMIN'],

  // --- Settings ---
  'settings:view': ['SUPER_ADMIN', 'ADMIN'],
  'settings:manage_integrations': ['SUPER_ADMIN'],
  'settings:manage_users': ['SUPER_ADMIN'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export interface PermissionItem {
  key: Permission;
  label: string;
  description: string;
  category:
    | 'Overview'
    | 'Revenue'
    | 'Inventory'
    | 'Meta Ads'
    | 'Partners'
    | 'Payouts'
    | 'Order Issues'
    | 'Expenses'
    | 'Monthly Bills'
    | 'Settings & Team';
}

export const PERMISSION_CATALOG: PermissionItem[] = [
  // Overview
  { key: 'overview:view_revenue', label: 'View Revenue & Profits', description: 'See Total Revenue, Margin, and Profit on Overview', category: 'Overview' },
  { key: 'overview:view_orders', label: 'View Total Orders', description: 'See order volume counts and high-level KPIs', category: 'Overview' },
  { key: 'overview:view_status', label: 'View Order Status', description: 'See delivery, fulfillment, and return breakdowns', category: 'Overview' },
  { key: 'overview:view_chart', label: 'View Overview Chart', description: 'Access revenue & order trend charts', category: 'Overview' },

  // Revenue
  { key: 'revenue:view', label: 'View Revenue Analytics', description: 'Access revenue metrics, gross profit, and ad spend ROI', category: 'Revenue' },

  // Inventory
  { key: 'inventory:view', label: 'View Inventory', description: 'Browse stock levels, variants, and product items', category: 'Inventory' },
  { key: 'inventory:view_valuation', label: 'View Inventory Valuation', description: 'See wholesale cost, inventory value, and unit prices', category: 'Inventory' },
  { key: 'inventory:sync', label: 'Sync Inventory', description: 'Trigger manual inventory replenishment sync', category: 'Inventory' },

  // Meta Ads
  { key: 'meta_ads:view', label: 'View Meta Ads', description: 'See ad spend analytics, daily planner, and weekly budgets', category: 'Meta Ads' },
  { key: 'meta_ads:edit', label: 'Manage Meta Ads', description: 'Set weekly budgets and record ad spend entries', category: 'Meta Ads' },
  { key: 'meta_ads:manage_planner', label: 'Manage Daily Planner', description: 'Configure daily campaigns, distribute budgets, and update execution status', category: 'Meta Ads' },

  // Partners
  { key: 'partners:view_all', label: 'View All Partners', description: 'Access full list of partners and equity shares', category: 'Partners' },
  { key: 'partners:view_self', label: 'View Own Partner Stats', description: 'Access partner dashboard (filtered to own profile)', category: 'Partners' },
  { key: 'partners:manage_partners', label: 'Manage Partners', description: 'Create, edit, or remove partner profiles', category: 'Partners' },
  { key: 'partners:record_transaction', label: 'Record Transactions', description: 'Add investment, withdrawal, or profit share transactions', category: 'Partners' },
  { key: 'partners:delete_transaction', label: 'Delete Transactions', description: 'Delete partner financial transactions', category: 'Partners' },

  // Payouts
  { key: 'payouts:view_all', label: 'View All Payouts', description: 'View full history of all partner distributions', category: 'Payouts' },
  { key: 'payouts:view_self', label: 'View Own Payouts', description: 'See payouts belonging to the user', category: 'Payouts' },
  { key: 'payouts:manage', label: 'Manage Payouts', description: 'Calculate and generate new payout periods', category: 'Payouts' },
  { key: 'payouts:mark_paid', label: 'Mark Payouts Paid', description: 'Update status of pending payout records', category: 'Payouts' },

  // Issues
  { key: 'issues:view', label: 'View Order Issues', description: 'Browse customer order issues and resolution logs', category: 'Order Issues' },
  { key: 'issues:create', label: 'Create Issues', description: 'Report new issues on customer orders', category: 'Order Issues' },
  { key: 'issues:edit', label: 'Edit Issues', description: 'Update status, assignees, and issue activities', category: 'Order Issues' },
  { key: 'issues:delete', label: 'Delete Issues', description: 'Remove issue records', category: 'Order Issues' },
  { key: 'issues:manage_categories', label: 'Manage Issue Categories', description: 'Create and edit issue classification categories', category: 'Order Issues' },

  // Expenses
  { key: 'expenses:view', label: 'View Daily Expenses', description: 'See daily expense logs, receipts, and summaries', category: 'Expenses' },
  { key: 'expenses:edit', label: 'Create & Edit Expenses', description: 'Add, update, or remove expense records and receipts', category: 'Expenses' },

  // Monthly Bills
  { key: 'monthly_expenses:view', label: 'View Monthly Bills', description: 'Access monthly recurring bills and budget tracking', category: 'Monthly Bills' },
  { key: 'monthly_expenses:edit', label: 'Edit Monthly Bills', description: 'Manage monthly budget caps, bill templates, and payment status', category: 'Monthly Bills' },
  { key: 'monthly_expenses:sync_sheets', label: 'Sync to Google Sheets', description: 'Trigger Google Sheets sync for expense records', category: 'Monthly Bills' },

  // Settings & Team
  { key: 'settings:view', label: 'View Settings', description: 'Access settings and configuration page', category: 'Settings & Team' },
  { key: 'settings:manage_integrations', label: 'Manage Integrations', description: 'Connect/re-auth Shopify and Google Sheets', category: 'Settings & Team' },
  { key: 'settings:manage_users', label: 'Manage Team & Roles', description: 'Invite users, assign roles, and create custom RBAC roles', category: 'Settings & Team' },
];

export const ROLE_COLOR_PALETTES: Record<string, { badge: string; bg: string; text: string; border: string }> = {
  purple: {
    badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    bg: 'bg-purple-500/10',
    text: 'text-purple-300',
    border: 'border-purple-500/30',
  },
  blue: {
    badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    bg: 'bg-blue-500/10',
    text: 'text-blue-300',
    border: 'border-blue-500/30',
  },
  emerald: {
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
  },
  amber: {
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    bg: 'bg-amber-500/10',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
  },
  rose: {
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    bg: 'bg-rose-500/10',
    text: 'text-rose-300',
    border: 'border-rose-500/30',
  },
  cyan: {
    badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-300',
    border: 'border-cyan-500/30',
  },
  indigo: {
    badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-300',
    border: 'border-indigo-500/30',
  },
  neutral: {
    badge: 'bg-neutral-500/15 text-neutral-300 border-neutral-500/30',
    bg: 'bg-neutral-500/10',
    text: 'text-neutral-300',
    border: 'border-neutral-500/30',
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
    return customPermissions.includes(permission);
  }

  const allowedRoles = PERMISSIONS[permission] as readonly string[] | undefined;
  if (allowedRoles) {
    return allowedRoles.includes(role);
  }

  return false;
}

/**
 * Route-level access mapping based on permissions.
 */
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  '/dashboard': 'overview:view_orders',
  '/revenue': 'revenue:view',
  '/inventory': 'inventory:view',
  '/meta-ads': 'meta_ads:view',
  '/partners': 'partners:view_self',
  '/payouts': 'payouts:view_self',
  '/order-issues': 'issues:view',
  '/expenses': 'expenses:view',
  '/monthly-expenses': 'monthly_expenses:view',
  '/team': 'settings:manage_users',
  '/settings': 'settings:view',
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

  // Match prefix
  for (const [route, permission] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname === route || (route !== '/' && pathname.startsWith(route))) {
      return hasPermission(role, permission, customPermissions);
    }
  }
  return true;
}
