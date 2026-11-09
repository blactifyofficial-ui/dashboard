import { NextResponse } from 'next/server';
import { db } from '@/db';
import { debts, debtSettlements, expenses } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';
import { hasPermission } from '@/lib/rbac';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; settlementId: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (!hasPermission(authResult.role, 'debts:manage', authResult.permissions)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to delete settlements' }, { status: 403 });
    }

    const { id, settlementId } = await params;

    const [settlement] = await db
      .select()
      .from(debtSettlements)
      .where(and(eq(debtSettlements.id, settlementId), eq(debtSettlements.debtId, id)))
      .limit(1);

    if (!settlement) {
      return NextResponse.json({ error: 'Settlement record not found' }, { status: 404 });
    }

    const [debt] = await db.select().from(debts).where(eq(debts.id, id)).limit(1);
    if (!debt) {
      return NextResponse.json({ error: 'Parent debt record not found' }, { status: 404 });
    }

    const settlementAmount = Number(settlement.amount) || 0;
    const currentRemaining = Number(debt.remainingAmount) || 0;
    const originalAmount = Number(debt.amount) || 0;

    const restoredRemaining = Math.min(originalAmount, currentRemaining + settlementAmount);
    const restoredStatus = restoredRemaining >= originalAmount - 0.001 ? 'ACTIVE' : 'PARTIALLY_SETTLED';

    // Delete linked expense if exists
    if (settlement.expenseId) {
      try {
        await db.delete(expenses).where(eq(expenses.id, settlement.expenseId));
      } catch (expErr) {
        console.error('Failed to clean up linked expense:', expErr);
      }
    }

    // Delete settlement record
    await db.delete(debtSettlements).where(eq(debtSettlements.id, settlementId));

    // Update parent debt
    const [updatedDebt] = await db
      .update(debts)
      .set({
        remainingAmount: restoredRemaining.toString(),
        status: restoredStatus,
        settledAt: null,
        updatedAt: new Date(),
      })
      .where(eq(debts.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Settlement reverted successfully',
      debt: updatedDebt,
    });
  } catch (error) {
    console.error('Error in DELETE /api/debts/[id]/settlements/[settlementId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

