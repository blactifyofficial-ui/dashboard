import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orderIssueActivities, orderIssues, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/server';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { remark } = await req.json();

    if (!remark?.trim()) {
      return NextResponse.json({ error: 'Remark cannot be empty' }, { status: 400 });
    }

    const { id } = await params;
    // Verify issue exists
    const [issue] = await db.select().from(orderIssues).where(eq(orderIssues.id, id));
    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    await db.insert(users).values({
      id: session.user.id,
      name: session.user.name || '',
      email: session.user.email || '',
    }).onConflictDoUpdate({
      target: users.id,
      set: {
        name: session.user.name || '',
        email: session.user.email || '',
      }
    });

    await db.insert(orderIssueActivities).values({
      id: crypto.randomUUID(),
      issueId: id,
      actorId: session.user.id,
      activityType: 'REMARK_ADDED',
      remark: remark.trim(),
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
