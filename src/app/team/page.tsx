import UserRoleManager from '@/components/UserRoleManager';
import { requirePermission } from '@/lib/auth-utils';
import AccessDenied from '@/components/AccessDenied';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Team & Roles | Blactify Dashboard',
  description: 'Manage users, assign roles, and configure dashboard access permissions.',
};

export default async function TeamPage() {
  const authRes = await requirePermission('settings:manage_users');

  if ('error' in authRes || authRes.error) {
    return (
      <AccessDenied
        title="Super Admin Required"
        message="You need Super Admin permissions to manage team members, roles, and access control."
      />
    );
  }

  return (
    <div className="flex flex-col space-y-4 sm:space-y-6 max-w-5xl mx-auto w-full pb-12">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">
              Team &amp; Roles (RBAC)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
              Access Control
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Invite members, assign permission tiers, and configure partner-scoped views across the dashboard.
          </p>
        </div>
      </header>

      {/* Main Team Management Component */}
      <UserRoleManager />
    </div>
  );
}
