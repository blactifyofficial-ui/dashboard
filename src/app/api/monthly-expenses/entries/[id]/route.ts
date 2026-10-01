import { NextResponse } from 'next/server';
import { db } from '@/db';
import { monthlyExpenseEntries } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';
import { 
  syncMonthlyBillPaymentToExpenses, 
  removeMonthlyBillPaymentFromExpenses 
} from '@/lib/monthly-expenses-sync';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const session = { user: authResult.user! };
    const { id } = await params;

    const [existing] = await db
      .select()
      .from(monthlyExpenseEntries)
      .where(eq(monthlyExpenseEntries.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      status,
      actualAmount,
      expectedAmount,
      paidDate,
      paymentMethodId,
      referenceNumber,
      notes,
      name,
      dueDay,
      category,
    } = body;

    const updateData: Partial<typeof monthlyExpenseEntries.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (category !== undefined) updateData.category = category;
    if (expectedAmount !== undefined) updateData.expectedAmount = expectedAmount.toString();
    if (dueDay !== undefined) updateData.dueDay = dueDay ? dueDay.toString() : null;
    if (paymentMethodId !== undefined) updateData.paymentMethodId = paymentMethodId || null;
    if (referenceNumber !== undefined) updateData.referenceNumber = referenceNumber?.trim() || null;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;

    const targetStatus = status !== undefined ? status : existing.status;
    updateData.status = targetStatus;

    if (targetStatus === 'PAID') {
      const resolvedPaidDate = paidDate ? new Date(paidDate) : (existing.paidDate || new Date());
      const resolvedActualAmount =
        actualAmount !== undefined
          ? actualAmount.toString()
          : (existing.actualAmount && parseFloat(existing.actualAmount) > 0
              ? existing.actualAmount
              : (expectedAmount !== undefined ? expectedAmount.toString() : existing.expectedAmount));

      updateData.paidById = session.user.id;
      updateData.paidDate = resolvedPaidDate;
      updateData.actualAmount = resolvedActualAmount;

      // Sync to Expenses table (only when marked as paid)
      const linkedExpenseId = await syncMonthlyBillPaymentToExpenses({
        existingExpenseId: existing.expenseId,
        month: existing.month,
        name: updateData.name || existing.name,
        category: updateData.category || existing.category,
        actualAmount: resolvedActualAmount,
        expectedAmount: updateData.expectedAmount || existing.expectedAmount,
        dueDay: updateData.dueDay !== undefined ? updateData.dueDay : existing.dueDay,
        paidDate: resolvedPaidDate,
        paymentMethodId: updateData.paymentMethodId !== undefined ? updateData.paymentMethodId : existing.paymentMethodId,
        referenceNumber: updateData.referenceNumber !== undefined ? updateData.referenceNumber : existing.referenceNumber,
        notes: updateData.notes !== undefined ? updateData.notes : existing.notes,
        userId: session.user.id,
        userName: session.user.name || undefined,
        userEmail: session.user.email || undefined,
      });

      updateData.expenseId = linkedExpenseId;
    } else {
      // Not PAID (PENDING or SKIPPED)
      updateData.paidById = null;
      updateData.paidDate = null;
      if (actualAmount === undefined) {
        updateData.actualAmount = '0';
      }

      // If it was previously linked to an Expense record, soft-delete it so it's not counted in Expenses
      if (existing.expenseId) {
        await removeMonthlyBillPaymentFromExpenses(
          existing.expenseId,
          session.user.id,
          `Removed because monthly bill was marked as ${targetStatus.toLowerCase()}`
        );
        updateData.expenseId = null;
      }
    }

    const [updated] = await db
      .update(monthlyExpenseEntries)
      .set(updateData)
      .where(eq(monthlyExpenseEntries.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating monthly expense entry:', error);
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
    const session = { user: authResult.user! };
    const { id } = await params;

    const [existing] = await db
      .select()
      .from(monthlyExpenseEntries)
      .where(eq(monthlyExpenseEntries.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // If an expense record was linked, clean it up
    if (existing.expenseId) {
      await removeMonthlyBillPaymentFromExpenses(
        existing.expenseId,
        session.user.id,
        'Removed because monthly bill entry was deleted'
      );
    }

    const [deleted] = await db
      .delete(monthlyExpenseEntries)
      .where(eq(monthlyExpenseEntries.id, id))
      .returning();

    return NextResponse.json({ success: true, id: deleted.id });
  } catch (error) {
    console.error('Error deleting monthly expense entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
