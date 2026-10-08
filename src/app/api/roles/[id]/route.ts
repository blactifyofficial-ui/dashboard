import { NextResponse } from 'next/server';
import { db } from '@/db';
import { customRoles, allowedUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requirePermission('settings:manage_users');
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, description, permissions, color } = body;

    const [targetRole] = await db
      .select()
      .from(customRoles)
      .where(eq(customRoles.id, id))
      .limit(1);

    if (!targetRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (targetRole.isSystem === 'true') {
      return NextResponse.json({ error: 'Built-in system roles cannot be modified directly' }, { status: 400 });
    }

    const validPermissions = Array.isArray(permissions)
      ? permissions.filter((p) => typeof p === 'string')
      : JSON.parse(targetRole.permissions);

    const [updated] = await db
      .update(customRoles)
      .set({
        name: name ? name.trim() : targetRole.name,
        description: description !== undefined ? description?.trim() : targetRole.description,
        color: color || targetRole.color,
        permissions: JSON.stringify(validPermissions),
        updatedAt: new Date(),
      })
      .where(eq(customRoles.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      role: {
        ...updated,
        permissions: validPermissions,
        isSystem: false,
      },
    });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requirePermission('settings:manage_users');
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;

    const [targetRole] = await db
      .select()
      .from(customRoles)
      .where(eq(customRoles.id, id))
      .limit(1);

    if (!targetRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (targetRole.isSystem === 'true') {
      return NextResponse.json({ error: 'Built-in system roles cannot be deleted' }, { status: 400 });
    }

    // Check if any allowed user currently has this role
    const assignedUsers = await db
      .select({ email: allowedUsers.email })
      .from(allowedUsers)
      .where(eq(allowedUsers.role, targetRole.code));

    if (assignedUsers.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete role '${targetRole.name}' because ${assignedUsers.length} user(s) currently have this role assigned. Please reassign them first.`,
        },
        { status: 400 }
      );
    }

    await db.delete(customRoles).where(eq(customRoles.id, id));

    return NextResponse.json({ success: true, message: `Role '${targetRole.name}' deleted successfully` });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}
