import { NextResponse } from 'next/server';
import { db } from '@/db';
import { monthlyExpenseMonthSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const { month, notes, budgetLimit, isUnlockedManual } = body;

    if (!month) {
      return NextResponse.json({ error: 'Month is required' }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(monthlyExpenseMonthSettings)
      .where(eq(monthlyExpenseMonthSettings.month, month))
      .limit(1);

    let result;
    if (existing.length > 0) {
      const updateData: Partial<typeof monthlyExpenseMonthSettings.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (notes !== undefined) updateData.notes = notes;
      if (budgetLimit !== undefined) updateData.budgetLimit = budgetLimit ? budgetLimit.toString() : null;
      if (isUnlockedManual !== undefined) updateData.isUnlockedManual = isUnlockedManual.toString();

      const [updated] = await db
        .update(monthlyExpenseMonthSettings)
        .set(updateData)
        .where(eq(monthlyExpenseMonthSettings.month, month))
        .returning();
      result = updated;
    } else {
      const [inserted] = await db
        .insert(monthlyExpenseMonthSettings)
        .values({
          month,
          notes: notes || null,
          budgetLimit: budgetLimit ? budgetLimit.toString() : null,
          isUnlockedManual: isUnlockedManual ? isUnlockedManual.toString() : 'false',
        })
        .returning();
      result = inserted;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving month settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
