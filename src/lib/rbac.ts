import { UserRole } from '@/db/schema';

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
} as const satisfies Record<string, readonly UserRole[]>;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Checks if a given role possesses a specific permission.
 */
export function hasPermission(role: UserRole | string | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const allowedRoles = PERMISSIONS[permission] as readonly string[];
  return allowedRoles.includes(role);
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
export function canAccessRoute(role: UserRole | string | undefined | null, pathname: string): boolean {
  if (!role) return false;
  // Match prefix
  for (const [route, permission] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname === route || (route !== '/' && pathname.startsWith(route))) {
      return hasPermission(role, permission);
    }
  }
  return true;
}
