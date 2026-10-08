import { NextResponse } from 'next/server';
import { db } from '@/db';
import { customRoles, allowedUsers, userRoles } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth-utils';
import { PERMISSION_CATALOG, PERMISSIONS } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authResult = await requirePermission('settings:manage_users');
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Fetch custom roles from database
    const dbCustomRoles = await db
      .select()
      .from(customRoles)
      .orderBy(desc(customRoles.createdAt));

    // Fetch all users to compute member counts per role
    const allUsers = await db
      .select({ role: allowedUsers.role })
      .from(allowedUsers);

    const userCountByRole: Record<string, number> = {};
    for (const u of allUsers) {
      userCountByRole[u.role] = (userCountByRole[u.role] || 0) + 1;
    }

    // Prepare system roles with baseline permissions
    const systemRoleDefinitions = userRoles.map((roleKey) => {
      // Find all permissions belonging to this role
      const permissions = Object.entries(PERMISSIONS)
        .filter(([, roles]) => (roles as readonly string[]).includes(roleKey))
        .map(([permKey]) => permKey);

      return {
        id: `sys_${roleKey}`,
        code: roleKey,
        name:
          roleKey === 'SUPER_ADMIN'
            ? 'Super Admin'
            : roleKey === 'ADMIN'
            ? 'Admin'
            : roleKey === 'STAFF'
            ? 'Staff'
            : roleKey === 'PARTNER'
            ? 'Partner'
            : 'Viewer',
        description:
          roleKey === 'SUPER_ADMIN'
            ? 'Full access to all financial data, partner capital, settings & users'
            : roleKey === 'ADMIN'
            ? 'Operational manager: orders, inventory, revenue, expenses, and ads'
            : roleKey === 'STAFF'
            ? 'Order issues and inventory stock counts (no financial figures)'
            : roleKey === 'PARTNER'
            ? 'Investor view: overview metrics and strictly their own capital & payouts'
            : 'Read-only access across approved non-sensitive overview views',
        permissions,
        color:
          roleKey === 'SUPER_ADMIN'
            ? 'purple'
            : roleKey === 'ADMIN'
            ? 'blue'
            : roleKey === 'STAFF'
            ? 'emerald'
            : roleKey === 'PARTNER'
            ? 'amber'
            : 'neutral',
        isSystem: true,
        userCount: userCountByRole[roleKey] || 0,
      };
    });

    const parsedCustomRoles = dbCustomRoles.map((r) => {
      let permissions: string[] = [];
      try {
        permissions = JSON.parse(r.permissions);
      } catch {
        permissions = [];
      }

      return {
        id: r.id,
        code: r.code,
        name: r.name,
        description: r.description || '',
        permissions,
        color: r.color || 'blue',
        isSystem: false,
        userCount: userCountByRole[r.code] || 0,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

    return NextResponse.json({
      systemRoles: systemRoleDefinitions,
      customRoles: parsedCustomRoles,
      permissionCatalog: PERMISSION_CATALOG,
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requirePermission('settings:manage_users');
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const { name, code, description, permissions, color } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    // Format code: uppercase, replace spaces with underscores, letters/numbers only
    const cleanCode = (code || name)
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, '_')
      .replace(/_+/g, '_');

    if (!cleanCode) {
      return NextResponse.json({ error: 'Valid role code is required' }, { status: 400 });
    }

    // Prevent clashing with system role names
    if ((userRoles as readonly string[]).includes(cleanCode)) {
      return NextResponse.json({ error: `Cannot use reserved system role code '${cleanCode}'` }, { status: 400 });
    }

    // Check if custom role code already exists
    const [existing] = await db
      .select()
      .from(customRoles)
      .where(eq(customRoles.code, cleanCode))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: `A role with code '${cleanCode}' already exists` }, { status: 409 });
    }

    const validPermissions = Array.isArray(permissions)
      ? permissions.filter((p) => typeof p === 'string')
      : [];

    const newId = crypto.randomUUID();
    const [newRole] = await db
      .insert(customRoles)
      .values({
        id: newId,
        code: cleanCode,
        name: name.trim(),
        description: description?.trim() || null,
        permissions: JSON.stringify(validPermissions),
        color: color || 'blue',
        isSystem: 'false',
        createdById: authResult.user.id,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        role: {
          ...newRole,
          permissions: validPermissions,
          isSystem: false,
          userCount: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating custom role:', error);
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}
