import { notFound } from 'next/navigation';
import RoleForm from '@/components/RoleForm';
import { requirePermission } from '@/lib/auth-utils';
import AccessDenied from '@/components/AccessDenied';
import { db } from '@/db';
import { customRoles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Edit Role | Blactify Dashboard',
  description: 'Update custom role details and permission checklist.',
};

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const authRes = await requirePermission('settings:manage_users');

  if ('error' in authRes || authRes.error) {
    return (
      <AccessDenied
        title="Super Admin Required"
        message="You need Super Admin permissions to edit custom roles."
      />
    );
  }

  const { id } = await params;

  const [role] = await db
    .select()
    .from(customRoles)
    .where(eq(customRoles.id, id))
    .limit(1);

  if (!role) {
    notFound();
  }

  let permissions: string[] = [];
  try {
    permissions = JSON.parse(role.permissions);
  } catch {
    permissions = [];
  }

  const initialData = {
    id: role.id,
    name: role.name,
    code: role.code,
    description: role.description || '',
    color: role.color,
    permissions,
    isSystem: role.isSystem === 'true',
  };

  return (
    <div className="max-w-4xl mx-auto w-full py-4 sm:py-6">
      <RoleForm isEdit={true} initialData={initialData} />
    </div>
  );
}
