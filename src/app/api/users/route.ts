import { NextResponse } from 'next/server';
import { db } from '@/db';
import { allowedUsers, partners, userRoles, UserRole } from '@/db/schema';
import { eq, ilike, desc } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authResult = await requirePermission('settings:manage_users');
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Fetch allowed users with partner details if linked
    const usersList = await db
      .select({
        id: allowedUsers.id,
        email: allowedUsers.email,
        role: allowedUsers.role,
        partnerId: allowedUsers.partnerId,
        partnerName: partners.name,
        createdAt: allowedUsers.createdAt,
        updatedAt: allowedUsers.updatedAt,
      })
      .from(allowedUsers)
      .leftJoin(partners, eq(allowedUsers.partnerId, partners.id))
      .orderBy(desc(allowedUsers.createdAt));

    // Fetch all active partners for assignment dropdown
    const allPartners = await db
      .select({
        id: partners.id,
        name: partners.name,
        email: partners.email,
      })
      .from(partners)
      .where(eq(partners.status, 'ACTIVE'))
      .orderBy(partners.name);

    return NextResponse.json({
      users: usersList,
      partners: allPartners,
      roles: userRoles,
      currentUserEmail: authResult.user.email,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requirePermission('settings:manage_users');
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const { email, role, partnerId } = body;

    if (!email || !email.trim() || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const assignedRole: UserRole = userRoles.includes(role) ? role : 'VIEWER';

    // Check if email already exists
    const [existing] = await db
      .select()
      .from(allowedUsers)
      .where(ilike(allowedUsers.email, cleanEmail))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: 'This user is already in the allowed users list' }, { status: 409 });
    }

    const newId = crypto.randomUUID();
    const [newUser] = await db
      .insert(allowedUsers)
      .values({
        id: newId,
        email: cleanEmail,
        role: assignedRole,
        partnerId: partnerId || null,
      })
      .returning();

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Error adding user:', error);
    return NextResponse.json({ error: 'Failed to add user' }, { status: 500 });
  }
}
