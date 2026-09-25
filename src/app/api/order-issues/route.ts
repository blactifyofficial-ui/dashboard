import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orderIssues, orderIssueActivities, users } from '@/db/schema';
import { eq, desc, and, ilike, or } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';

export async function GET(req: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const session = { user: authResult.user! };

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '15', 10);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const q = searchParams.get('q');

    const offset = (page - 1) * pageSize;
    
    const conditions = [];
    if (orderId) conditions.push(eq(orderIssues.orderId, orderId));
    if (status) conditions.push(eq(orderIssues.status, status));
    if (priority) conditions.push(eq(orderIssues.priority, priority));
    if (q) conditions.push(
      or(
        ilike(orderIssues.id, `%${q}%`),
        ilike(orderIssues.title, `%${q}%`),
        ilike(orderIssues.orderId, `%${q}%`)
      )
    );

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const issues = await db.select().from(orderIssues)
      .where(whereClause)
      .orderBy(desc(orderIssues.createdAt))
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json(issues);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const session = { user: authResult.user! };

    const body = await req.json();
    const { orderId, categoryId, title, description, priority = 'MEDIUM', assignedToId, initialRemark } = body;

    if (!orderId || !categoryId || !title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const issueId = crypto.randomUUID();

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

    const [issue] = await db.insert(orderIssues).values({
      id: issueId,
      orderId,
      categoryId,
      title: title.trim(),
      description: description.trim(),
      status: 'OPEN',
      priority,
      assignedToId: assignedToId || session.user.id,
      createdById: session.user.id,
    }).returning();

    await db.insert(orderIssueActivities).values({
      id: crypto.randomUUID(),
      issueId,
      actorId: session.user.id,
      activityType: 'CREATED',
      newStatus: 'OPEN',
      newPriority: priority,
      newAssignedToId: assignedToId || session.user.id,
    });

    if (initialRemark && initialRemark.trim().length > 0) {
      await db.insert(orderIssueActivities).values({
        id: crypto.randomUUID(),
        issueId,
        actorId: session.user.id,
        activityType: 'REMARK_ADDED',
        remark: initialRemark.trim(),
      });
    }

    return NextResponse.json(issue, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
