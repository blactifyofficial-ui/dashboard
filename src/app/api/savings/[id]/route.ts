import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dailySavings, expenses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';
import { hasPermission } from '@/lib/rbac';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (!hasPermission(authResult.role, 'savings:manage', authResult.permissions)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to modify savings' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { amount, destination, paymentMethodId, note } = body;

    const [existing] = await db
      .select()
      .from(dailySavings)
      .where(eq(dailySavings.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Daily saving entry not found' }, { status: 404 });
    }

    const updateData: Partial<typeof dailySavings.$inferInsert> = {
      updatedById: authResult.user.id,
      updatedAt: new Date(),
    };

    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
      }
      updateData.amount = numAmount.toString();

      // If mirrored to an expense, update the linked expense amount
      if (existing.expenseId) {
        try {
          await db
            .update(expenses)
            .set({
              amount: numAmount.toString(),
              description: note !== undefined ? note : undefined,
              paymentMethodId: paymentMethodId !== undefined ? paymentMethodId : undefined,
              updatedById: authResult.user.id,
              updatedAt: new Date(),
            })
            .where(eq(expenses.id, existing.expenseId));
        } catch (expErr) {
          console.error('Failed to update mirrored expense:', expErr);
        }
      }
    }

    if (destination !== undefined) updateData.destination = destination;
    if (paymentMethodId !== undefined) updateData.paymentMethodId = paymentMethodId || null;
    if (note !== undefined) updateData.note = note?.trim() || null;

    const [updated] = await db
      .update(dailySavings)
      .set(updateData)
      .where(eq(dailySavings.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in PUT /api/savings/[id]:', error);
    return NextResponse.json({ error: 'Failed to update daily saving' }, { status: 500 });
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

    if (!hasPermission(authResult.role, 'savings:delete', authResult.permissions)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to delete savings' }, { status: 403 });
    }

    const { id } = await params;

    const [existing] = await db
      .select()
      .from(dailySavings)
      .where(eq(dailySavings.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Daily saving entry not found' }, { status: 404 });
    }

    // If an expense was linked, clean it up
    if (existing.expenseId) {
      try {
        await db.delete(expenses).where(eq(expenses.id, existing.expenseId));
      } catch (expErr) {
        console.error('Failed to delete mirrored expense:', expErr);
      }
    }

    await db.delete(dailySavings).where(eq(dailySavings.id, id));

    return NextResponse.json({ success: true, message: 'Daily saving entry deleted' });
  } catch (error) {
    console.error('Error in DELETE /api/savings/[id]:', error);
    return NextResponse.json({ error: 'Failed to delete daily saving' }, { status: 500 });
  }
}

