import { NextResponse } from 'next/server';
import { db } from '@/db';
import { monthlyExpenseTemplates, monthlyExpenseEntries } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';
import { enqueueSyncJob } from '@/lib/google-sheets';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { id } = await params;

    const body = await req.json();
    const { name, defaultAmount, dueDay, category, notes, paymentMethodId, isActive, displayOrder } = body;

    const updateData: Partial<typeof monthlyExpenseTemplates.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (defaultAmount !== undefined) updateData.defaultAmount = defaultAmount.toString();
    if (dueDay !== undefined) updateData.dueDay = dueDay ? dueDay.toString() : '5';
    if (category !== undefined) updateData.category = category;
    if (paymentMethodId !== undefined) updateData.paymentMethodId = paymentMethodId || null;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;
    if (isActive !== undefined) updateData.isActive = isActive.toString();
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder.toString();

    const [updated] = await db
      .update(monthlyExpenseTemplates)
      .set(updateData)
      .where(eq(monthlyExpenseTemplates.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Template item not found' }, { status: 404 });
    }

    // Automatically sync template to Google Sheets
    void enqueueSyncJob({
      entity: 'monthly_expense_templates',
      databaseId: id,
      operation: 'UPDATE',
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating template item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { id } = await params;

    // Unlink any entries using this template to avoid foreign key violations
    await db
      .update(monthlyExpenseEntries)
      .set({ templateId: null })
      .where(eq(monthlyExpenseEntries.templateId, id));

    const [deleted] = await db
      .delete(monthlyExpenseTemplates)
      .where(eq(monthlyExpenseTemplates.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Template item not found' }, { status: 404 });
    }

    // Automatically sync template deletion to Google Sheets
    void enqueueSyncJob({
      entity: 'monthly_expense_templates',
      databaseId: id,
      operation: 'DELETE',
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting template item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

