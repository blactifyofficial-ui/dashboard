import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orderIssues, orderIssueActivities, issueCategories } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;
    const [issue] = await db
      .select({
        id: orderIssues.id,
        orderId: orderIssues.orderId,
        title: orderIssues.title,
        description: orderIssues.description,
        status: orderIssues.status,
        priority: orderIssues.priority,
        createdAt: orderIssues.createdAt,
        updatedAt: orderIssues.updatedAt,
        assignedToId: orderIssues.assignedToId,
        category: issueCategories.name,
      })
      .from(orderIssues)
      .leftJoin(issueCategories, eq(orderIssues.categoryId, issueCategories.id))
      .where(eq(orderIssues.id, id));

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    const activities = await db
      .select()
      .from(orderIssueActivities)
      .where(eq(orderIssueActivities.issueId, id))
      .orderBy(desc(orderIssueActivities.createdAt));

    return NextResponse.json({ ...issue, activities });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;
    
    await db.batch([
      db.delete(orderIssueActivities).where(eq(orderIssueActivities.issueId, id)),
      db.delete(orderIssues).where(eq(orderIssues.id, id))
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
