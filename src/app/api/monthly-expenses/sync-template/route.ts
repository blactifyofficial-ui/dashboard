import { NextResponse } from 'next/server';
import { db } from '@/db';
import { monthlyExpenseTemplates, monthlyExpenseEntries } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const { month } = body;

    if (!month) {
      return NextResponse.json({ error: 'Month is required' }, { status: 400 });
    }

    // Get active templates
    const templates = await db
      .select()
      .from(monthlyExpenseTemplates)
      .where(eq(monthlyExpenseTemplates.isActive, 'true'))
      .orderBy(asc(monthlyExpenseTemplates.displayOrder));

    // Get existing entries for this month
    const existingEntries = await db
      .select()
      .from(monthlyExpenseEntries)
      .where(eq(monthlyExpenseEntries.month, month));

    const existingTemplateIds = new Set(
      existingEntries.filter((e) => e.templateId).map((e) => e.templateId)
    );

    let addedCount = 0;
    for (const tpl of templates) {
      if (!existingTemplateIds.has(tpl.id)) {
        await db.insert(monthlyExpenseEntries).values({
          id: crypto.randomUUID(),
          month,
          templateId: tpl.id,
          name: tpl.name,
          category: tpl.category,
          expectedAmount: tpl.defaultAmount,
          actualAmount: '0',
          dueDay: tpl.dueDay,
          status: 'PENDING',
          paymentMethodId: tpl.paymentMethodId,
          notes: tpl.notes,
          displayOrder: tpl.displayOrder,
        });
        addedCount++;
      }
    }

    return NextResponse.json({ success: true, addedCount });
  } catch (error) {
    console.error('Error syncing template to month:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
