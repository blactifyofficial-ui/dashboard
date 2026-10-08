import { NextResponse } from 'next/server';
import { db } from '@/db';
import { allowedUsers, customRoles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth-utils';
import { sendTeamInvitationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requirePermission('settings:manage_users');
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;

    const [user] = await db
      .select()
      .from(allowedUsers)
      .where(eq(allowedUsers.id, id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Resolve human-readable role name
    let roleDisplayName = user.role;
    if (user.role === 'SUPER_ADMIN') roleDisplayName = 'Super Admin';
    else if (user.role === 'ADMIN') roleDisplayName = 'Admin';
    else if (user.role === 'STAFF') roleDisplayName = 'Staff';
    else if (user.role === 'PARTNER') roleDisplayName = 'Partner';
    else if (user.role === 'VIEWER') roleDisplayName = 'Viewer';
    else {
      const [customRoleRec] = await db
        .select({ name: customRoles.name })
        .from(customRoles)
        .where(eq(customRoles.code, user.role))
        .limit(1);
      if (customRoleRec) {
        roleDisplayName = customRoleRec.name;
      }
    }

    const emailResult = await sendTeamInvitationEmail({
      toEmail: user.email,
      roleName: roleDisplayName,
      invitedByName: authResult.user.name,
      invitedByEmail: authResult.user.email,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || 'Failed to send email via Resend' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Invitation email sent to ${user.email}`,
    });
  } catch (error) {
    console.error('Error resending invitation:', error);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}
