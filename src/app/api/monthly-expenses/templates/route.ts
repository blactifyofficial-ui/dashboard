import { NextResponse } from 'next/server';
import { db } from '@/db';
import { monthlyExpenseTemplates } from '@/db/schema';
import { asc } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';
import { enqueueSyncJob } from '@/lib/google-sheets';

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const templates = await db
      .select()
      .from(monthlyExpenseTemplates)
      .orderBy(asc(monthlyExpenseTemplates.displayOrder), asc(monthlyExpenseTemplates.createdAt));

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const { name, defaultAmount, dueDay, category, notes, paymentMethodId, displayOrder } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const [template] = await db
      .insert(monthlyExpenseTemplates)
      .values({
        id,
        name: name.trim(),
        defaultAmount: defaultAmount ? defaultAmount.toString() : '0',
        dueDay: dueDay ? dueDay.toString() : '5',
        category: category || 'OPERATIONAL',
        paymentMethodId: paymentMethodId || null,
        notes: notes?.trim() || null,
        isActive: 'true',
        displayOrder: displayOrder ? displayOrder.toString() : '0',
      })
      .returning();

    // Automatically sync template to Google Sheets
    void enqueueSyncJob({
      entity: 'monthly_expense_templates',
      databaseId: id,
      operation: 'CREATE',
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating template item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

