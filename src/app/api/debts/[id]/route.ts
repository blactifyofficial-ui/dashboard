import { NextResponse } from 'next/server';
import { db } from '@/db';
import { debts, debtSettlements, paymentMethods, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';
import { hasPermission } from '@/lib/rbac';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (!hasPermission(authResult.role, 'debts:view', authResult.permissions)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to view debt' }, { status: 403 });
    }

    const { id } = await params;

    const [debt] = await db
      .select({
        id: debts.id,
        type: debts.type,
        contactId: debts.contactId,
        contactName: debts.contactName,
        contactPhone: debts.contactPhone,
        contactEmail: debts.contactEmail,
        category: debts.category,
        amount: debts.amount,
        remainingAmount: debts.remainingAmount,
        transactionDate: debts.transactionDate,
        dueDate: debts.dueDate,
        paymentMethodId: debts.paymentMethodId,
        paymentMethodName: paymentMethods.name,
        status: debts.status,
        referenceNumber: debts.referenceNumber,
        notes: debts.notes,
        createdById: debts.createdById,
        creatorName: users.name,
        settledAt: debts.settledAt,
        createdAt: debts.createdAt,
        updatedAt: debts.updatedAt,
      })
      .from(debts)
      .leftJoin(paymentMethods, eq(debts.paymentMethodId, paymentMethods.id))
      .leftJoin(users, eq(debts.createdById, users.id))
      .where(eq(debts.id, id))
      .limit(1);

    if (!debt) {
      return NextResponse.json({ error: 'Debt record not found' }, { status: 404 });
    }

    // Fetch all settlements for this debt
    const settlements = await db
      .select({
        id: debtSettlements.id,
        debtId: debtSettlements.debtId,
        amount: debtSettlements.amount,
        settlementDate: debtSettlements.settlementDate,
        paymentMethodId: debtSettlements.paymentMethodId,
        paymentMethodName: paymentMethods.name,
        referenceNumber: debtSettlements.referenceNumber,
        notes: debtSettlements.notes,
        expenseId: debtSettlements.expenseId,
        createdById: debtSettlements.createdById,
        creatorName: users.name,
        createdAt: debtSettlements.createdAt,
      })
      .from(debtSettlements)
      .leftJoin(paymentMethods, eq(debtSettlements.paymentMethodId, paymentMethods.id))
      .leftJoin(users, eq(debtSettlements.createdById, users.id))
      .where(eq(debtSettlements.debtId, id))
      .orderBy(desc(debtSettlements.settlementDate), desc(debtSettlements.createdAt));

    const now = new Date();
    const isPastDue = debt.dueDate ? new Date(debt.dueDate) < now : false;
    const isSettled = debt.status === 'SETTLED' || Number(debt.remainingAmount) <= 0.001;
    let computedStatus = debt.status;
    if (!isSettled && isPastDue) {
      computedStatus = 'OVERDUE';
    }

    return NextResponse.json({
      debt: {
        ...debt,
        computedStatus,
        isOverdue: !isSettled && isPastDue,
      },
      settlements,
    });
  } catch (error) {
    console.error('Error in GET /api/debts/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (!hasPermission(authResult.role, 'debts:manage', authResult.permissions)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to update debt' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const [existing] = await db.select().from(debts).where(eq(debts.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'Debt record not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.contactId !== undefined) updateData.contactId = body.contactId || null;
    if (body.contactName !== undefined) updateData.contactName = body.contactName.trim();
    if (body.contactPhone !== undefined) updateData.contactPhone = body.contactPhone?.trim() || null;
    if (body.contactEmail !== undefined) updateData.contactEmail = body.contactEmail?.trim() || null;
    if (body.category !== undefined) updateData.category = body.category.trim().toUpperCase();
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.paymentMethodId !== undefined) updateData.paymentMethodId = body.paymentMethodId || null;
    if (body.referenceNumber !== undefined) updateData.referenceNumber = body.referenceNumber?.trim() || null;
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;

    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === 'SETTLED') {
        updateData.settledAt = new Date();
      } else {
        updateData.settledAt = null;
      }
    }

    const [updated] = await db
      .update(debts)
      .set(updateData)
      .where(eq(debts.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error in PATCH /api/debts/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (!hasPermission(authResult.role, 'debts:delete', authResult.permissions)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to delete debt' }, { status: 403 });
    }

    const { id } = await params;

    const [deleted] = await db.delete(debts).where(eq(debts.id, id)).returning();
    if (!deleted) {
      return NextResponse.json({ error: 'Debt record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Debt deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/debts/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

