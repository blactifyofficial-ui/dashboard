import { NextResponse } from 'next/server';
import { db } from '@/db';
import { debts, debtSettlements, expenses, expenseCategories, paymentMethods, users } from '@/db/schema';
import { eq, ilike } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';
import { hasPermission } from '@/lib/rbac';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (!hasPermission(authResult.role, 'debts:manage', authResult.permissions)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to record settlements' }, { status: 403 });
    }

    const sessionUser = authResult.user!;
    const { id } = await params;
    const body = await req.json();

    const { amount, settlementDate, paymentMethodId, referenceNumber, notes, recordAsExpense } = body;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Settlement amount must be a positive number' }, { status: 400 });
    }

    // Fetch existing debt
    const [debt] = await db.select().from(debts).where(eq(debts.id, id)).limit(1);
    if (!debt) {
      return NextResponse.json({ error: 'Debt record not found' }, { status: 404 });
    }

    const currentRemaining = Number(debt.remainingAmount) || 0;
    if (currentRemaining <= 0.001) {
      return NextResponse.json({ error: 'This debt is already fully settled' }, { status: 400 });
    }

    if (numAmount > currentRemaining + 0.01) {
      return NextResponse.json({
        error: `Settlement amount (₹${numAmount}) exceeds the remaining balance (₹${currentRemaining.toFixed(2)})`,
      }, { status: 400 });
    }

    // Ensure session user exists in users table
    await db
      .insert(users)
      .values({
        id: sessionUser.id,
        name: sessionUser.name || '',
        email: sessionUser.email || '',
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          name: sessionUser.name || '',
          email: sessionUser.email || '',
        },
      });

    const settlementId = `dset_${crypto.randomUUID()}`;
    const sDate = settlementDate ? new Date(settlementDate) : new Date();

    let linkedExpenseId: string | null = null;

    // Optional Expense sync (especially for Borrowed repayments which represent actual business cash outflow)
    if (recordAsExpense) {
      try {
        let [cat] = await db
          .select({ id: expenseCategories.id })
          .from(expenseCategories)
          .where(ilike(expenseCategories.name, 'Loan & Debt Repayments'))
          .limit(1);

        if (!cat) {
          const newCatId = crypto.randomUUID();
          await db.insert(expenseCategories).values({
            id: newCatId,
            code: 'DEBT_REPAYMENTS',
            name: 'Loan & Debt Repayments',
            description: 'Settlement of borrowed amounts or loan installments',
          });
          cat = { id: newCatId };
        }

        linkedExpenseId = crypto.randomUUID();
        const expenseTitle =
          debt.type === 'BORROWED'
            ? `Debt Repayment to ${debt.contactName}`
            : `Lent Settlement Received from ${debt.contactName}`;

        await db.insert(expenses).values({
          id: linkedExpenseId,
          categoryId: cat.id,
          paymentMethodId: paymentMethodId || debt.paymentMethodId || (await db.select().from(paymentMethods).limit(1))[0]?.id,
          title: expenseTitle,
          description: notes?.trim() || `Settlement of ₹${numAmount} for debt ${debt.referenceNumber || debt.id}`,
          amount: numAmount.toString(),
          expenseDate: sDate,
          referenceNumber: referenceNumber?.trim() || debt.referenceNumber || null,
          createdById: sessionUser.id,
        });
      } catch (expErr) {
        console.error('Failed to auto-create linked expense for settlement:', expErr);
      }
    }

    // Insert settlement
    const [settlement] = await db
      .insert(debtSettlements)
      .values({
        id: settlementId,
        debtId: debt.id,
        amount: numAmount.toString(),
        settlementDate: sDate,
        paymentMethodId: paymentMethodId || null,
        referenceNumber: referenceNumber?.trim() || null,
        notes: notes?.trim() || null,
        expenseId: linkedExpenseId,
        createdById: sessionUser.id,
      })
      .returning();

    // Calculate new remaining and status
    const newRemaining = Math.max(0, currentRemaining - numAmount);
    const isNowSettled = newRemaining <= 0.001;
    const newStatus = isNowSettled ? 'SETTLED' : 'PARTIALLY_SETTLED';

    const [updatedDebt] = await db
      .update(debts)
      .set({
        remainingAmount: newRemaining.toString(),
        status: newStatus,
        settledAt: isNowSettled ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(debts.id, id))
      .returning();

    return NextResponse.json({
      settlement,
      debt: updatedDebt,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/debts/[id]/settlements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

