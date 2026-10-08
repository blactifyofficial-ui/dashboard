import RoleForm from '@/components/RoleForm';
import { requirePermission } from '@/lib/auth-utils';
import AccessDenied from '@/components/AccessDenied';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Create Custom Role | Blactify Dashboard',
  description: 'Define a new RBAC role with custom permission checklist and branding.',
};

export default async function NewRolePage() {
  const authRes = await requirePermission('settings:manage_users');

  if ('error' in authRes || authRes.error) {
    return (
      <AccessDenied
        title="Super Admin Required"
        message="You need Super Admin permissions to create new custom roles."
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full py-4 sm:py-6">
      <RoleForm isEdit={false} />
    </div>
  );
}
