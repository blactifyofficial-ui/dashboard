import { NextResponse } from 'next/server';
import { db } from '@/db';
import { allowedUsers, userRoles, UserRole } from '@/db/schema';
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
    const { role, partnerId } = body;

    const [targetUser] = await db
      .select()
      .from(allowedUsers)
      .where(eq(allowedUsers.id, id))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent removing your own SUPER_ADMIN role
    if (
      targetUser.email.toLowerCase() === authResult.user.email?.toLowerCase() &&
      role !== 'SUPER_ADMIN'
    ) {
      return NextResponse.json(
        { error: 'You cannot demote your own Super Admin account' },
        { status: 400 }
      );
    }

    const updatedRole: UserRole = userRoles.includes(role) ? role : targetUser.role;

    const [updated] = await db
      .update(allowedUsers)
      .set({
        role: updatedRole,
        partnerId: partnerId !== undefined ? (partnerId || null) : targetUser.partnerId,
        updatedAt: new Date(),
      })
      .where(eq(allowedUsers.id, id))
      .returning();

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
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

    const [targetUser] = await db
      .select()
      .from(allowedUsers)
      .where(eq(allowedUsers.id, id))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deleting yourself
    if (targetUser.email.toLowerCase() === authResult.user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: 'You cannot delete your own account from the allowed list' },
        { status: 400 }
      );
    }

    await db.delete(allowedUsers).where(eq(allowedUsers.id, id));

    return NextResponse.json({ success: true, message: 'User removed from allowed list' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to remove user' }, { status: 500 });
  }
}
