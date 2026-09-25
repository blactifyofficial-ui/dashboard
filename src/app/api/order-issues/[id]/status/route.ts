import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orderIssueActivities, orderIssues, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/server';

const VALID_TRANSITIONS: Record<string, string[]> = {
  'OPEN': ['IN_PROGRESS', 'CANCELLED'],
  'IN_PROGRESS': ['WAITING', 'RESOLVED', 'CANCELLED'],
  'WAITING': ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  'RESOLVED': ['CLOSED', 'IN_PROGRESS'],
  'CLOSED': [],
  'CANCELLED': []
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, lastUpdatedAt } = await req.json();

    const { id } = await params;
    const [issue] = await db.select().from(orderIssues).where(eq(orderIssues.id, id));
    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Optimistic Concurrency Control
    if (lastUpdatedAt && new Date(issue.updatedAt).getTime() !== new Date(lastUpdatedAt).getTime()) {
      return NextResponse.json({ 
        error: 'Conflict: This issue was updated by another user. Please refresh and try again.' 
      }, { status: 409 });
    }

    if (issue.status === status) {
      return NextResponse.json({ error: 'Status is already ' + status }, { status: 400 });
    }

    const allowedNext = VALID_TRANSITIONS[issue.status] || [];
    if (!allowedNext.includes(status)) {
      return NextResponse.json({ error: `Invalid transition from ${issue.status} to ${status}` }, { status: 400 });
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

    await db.batch([
      db.update(orderIssues)
        .set({ status, updatedAt: new Date() })
        .where(eq(orderIssues.id, id)),

      db.insert(orderIssueActivities).values({
        id: crypto.randomUUID(),
        issueId: id,
        actorId: session.user.id,
        activityType: 'STATUS_CHANGED',
        oldStatus: issue.status,
        newStatus: status,
      })
    ]);

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
