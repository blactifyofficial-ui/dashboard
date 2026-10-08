import { auth } from '@/lib/auth/server';
import { db } from '@/db';
import { allowedUsers, UserRole } from '@/db/schema';
import { ilike } from 'drizzle-orm';
import { hasPermission, Permission } from '@/lib/rbac';

export type AuthResult = {
  error?: string;
  status?: 401 | 403;
  user?: NonNullable<Awaited<ReturnType<typeof auth.getSession>>['data']>['user'];
  role?: UserRole;
  partnerId?: string | null;
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

  return {
    user: session.user,
    role: (allowed.role || 'VIEWER') as UserRole,
    partnerId: allowed.partnerId || null,
  };
}

export async function requirePermission(permission: Permission): Promise<AuthResult> {
  const authRes = await requireAuth();
  if (authRes.error) {
    return authRes;
  }

  if (!hasPermission(authRes.role, permission)) {
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



