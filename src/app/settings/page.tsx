import Link from 'next/link';
import SyncButton from '@/components/SyncButton';
import CategoryManager from '@/components/CategoryManager';
import InstallPWA from '@/components/InstallPWA';
import GoogleSheetsSettings from '@/components/GoogleSheetsSettings';
import { requirePermission } from '@/lib/auth-utils';
import { hasPermission } from '@/lib/rbac';
import AccessDenied from '@/components/AccessDenied';

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const authRes = await requirePermission('settings:view');
  if ('error' in authRes) {
    return <AccessDenied message="You do not have permission to view settings." />;
  }

  const canManageUsers = hasPermission(authRes.role, 'settings:manage_users');
  const canManageIntegrations = hasPermission(authRes.role, 'settings:manage_integrations');

  const shopifyAuthUrl = `https://admin.shopify.com/store/${process.env.SHOPIFY_SHOP_NAME?.replace('.myshopify.com', '')}/oauth/authorize?client_id=${process.env.SHOPIFY_CLIENT_ID}&scope=read_all_orders,read_assigned_fulfillment_orders,read_orders,read_product_feeds,read_product_listings,read_third_party_fulfillment_orders,read_products,read_inventory,read_locations&redirect_uri=https://dashboard.blactify.com/api/auth/callback`;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto text-black">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-6 sm:mb-8">Settings</h1>

      <div className="grid grid-cols-1 gap-6">
        {/* Team & User Role Management Link (Super Admin) */}
        {canManageUsers && (
          <div className="bg-[#1e1e1e] p-4 sm:p-6 rounded-xl border border-white/10 shadow-sm text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-medium mb-1">Team &amp; Role Management (RBAC)</h2>
                <p className="text-xs sm:text-sm text-gray-400">
                  Invite team members, assign permission tiers, and configure partner-scoped views.
                </p>
              </div>
              <Link
                href="/team"
                className="inline-flex items-center justify-center px-4 py-2.5 bg-white text-black text-xs sm:text-sm font-semibold rounded-xl hover:bg-neutral-200 transition-all shrink-0 shadow-sm"
              >
                Manage Team &amp; Roles
              </Link>
            </div>
          </div>
        )}

        {/* Google Sheets Backup Section */}
        {canManageIntegrations && <GoogleSheetsSettings />}

        {/* Manual Sync Section */}
        <div className="bg-[#1e1e1e] p-4 sm:p-6 rounded-xl border border-white/10 shadow-sm text-white">
          <h2 className="text-lg sm:text-xl font-medium mb-4 border-b border-white/10 pb-2">Manual Sync</h2>
          <div className="space-y-4 text-sm text-gray-300">
            <p>
              By default, webhooks should handle most of your order syncing. If you are missing recent orders or if new product images haven&apos;t loaded yet, you can trigger a manual sync to pull the latest data from Shopify.
            </p>
            <div className="mt-4">
              <SyncButton />
            </div>
          </div>
        </div>

        {/* Authorization Section */}
        {canManageIntegrations && (
          <div className="bg-[#1e1e1e] p-4 sm:p-6 rounded-xl border border-white/10 shadow-sm text-white">
            <h2 className="text-lg sm:text-xl font-medium mb-4 border-b border-white/10 pb-2">Shopify Integration</h2>
            <div className="space-y-4 text-sm text-gray-300">
              <p>
                If you ever need to re-authenticate your Shopify application or update your permissions (for example, if your <code>shpat_</code> access token expires or is invalidated), use the button below to authorize the app again.
              </p>
              <div className="mt-4">
                <Link 
                  href={shopifyAuthUrl}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto h-11 min-h-[44px] inline-flex items-center justify-center bg-white text-black px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Re-Authorize Shopify App
                </Link>
              </div>
              <p className="mt-4 text-xs text-gray-500">
                Ensure your Client ID and Shop Name are set in the <code>.env.local</code> file for this to work.
              </p>
            </div>
          </div>
        )}
        
        {/* Category Management */}
        <CategoryManager />

        {/* Install App Section */}
        <div className="bg-[#1e1e1e] p-4 sm:p-6 rounded-xl border border-white/10 shadow-sm text-white">
          <h2 className="text-lg sm:text-xl font-medium mb-4 border-b border-white/10 pb-2">Install App</h2>
          <div className="space-y-4 text-sm text-gray-300">
            <p>
              Install the Blactify Dashboard as an application on your device for quick access and a better native experience.
            </p>
            <InstallPWA />
          </div>
        </div>
      </div>
    </div>
  );
}

