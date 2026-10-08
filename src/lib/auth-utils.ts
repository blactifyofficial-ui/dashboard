import { auth } from '@/lib/auth/server';
import { db } from '@/db';
import { allowedUsers, customRoles, UserRole, userRoles } from '@/db/schema';
import { ilike, eq } from 'drizzle-orm';
import { hasPermission, Permission } from '@/lib/rbac';

export type AuthResult = {
  error?: string;
  status?: 401 | 403;
  user?: NonNullable<Awaited<ReturnType<typeof auth.getSession>>['data']>['user'];
  role?: UserRole;
  partnerId?: string | null;
  permissions?: string[];
};

export async function requireAuth(): Promise<AuthResult> {
  const { data: session } = await auth.getSession();
  
  if (!session?.user?.email || !session.user) {
    return { error: 'Unauthorized', status: 401 };
  }

  // Check if user is in allowed_users table
  const [allowed] = await db
    .select()
    .from(allowedUsers)
    .where(ilike(allowedUsers.email, session.user.email))
    .limit(1);
  
  if (!allowed) {
    return { error: 'Forbidden: User is not authorized to access this system', status: 403 };
  }

  const role = (allowed.role || 'VIEWER') as UserRole;
  let permissions: string[] = [];

  // If role is a custom role (not in built-in userRoles), fetch its permissions
  if (!userRoles.includes(role as typeof userRoles[number])) {
    const [customRoleRecord] = await db
      .select()
      .from(customRoles)
      .where(eq(customRoles.code, role))
      .limit(1);

    if (customRoleRecord?.permissions) {
      try {
        permissions = JSON.parse(customRoleRecord.permissions);
      } catch (err) {
        console.error('Failed to parse custom role permissions JSON:', err);
      }
    }
  }

  return {
    user: session.user,
    role,
    partnerId: allowed.partnerId || null,
    permissions,
  };
}

export async function requirePermission(permission: Permission): Promise<AuthResult> {
  const authRes = await requireAuth();
  if (authRes.error) {
    return authRes;
  }

  if (!hasPermission(authRes.role, permission, authRes.permissions)) {
    return { error: `Forbidden: Role '${authRes.role}' does not have permission for '${permission}'`, status: 403 };
  }

  return authRes;
}

export async function requireRole(allowedRoles: readonly UserRole[]): Promise<AuthResult> {
  const authRes = await requireAuth();
  if (authRes.error) {
    return authRes;
  }

  if (!authRes.role || !allowedRoles.includes(authRes.role)) {
    return { error: `Forbidden: Role '${authRes.role}' is not in allowed roles`, status: 403 };
  }

  return authRes;
}



