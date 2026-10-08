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
    <div className="flex flex-col space-y-4 sm:space-y-6 max-w-5xl mx-auto w-full pb-12 text-foreground">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Team &amp; Roles
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Invite members, assign permission tiers, and configure partner-scoped views across the dashboard.
          </p>
        </div>
      </header>

      {/* Main Team Management Component */}
      <UserRoleManager />
    </div>
  );
}
