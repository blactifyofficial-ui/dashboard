import { NextResponse } from 'next/server';
import { db } from '@/db';
import { debts, debtSettlements, debtContacts, expenses, expenseCategories, paymentMethods, users } from '@/db/schema';
import { eq, and, sql, ilike, or } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';
import { hasPermission } from '@/lib/rbac';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (!hasPermission(authResult.role, 'debts:manage', authResult.permissions)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to adjust debts' }, { status: 403 });
    }

    const sessionUser = authResult.user!;
    const { id } = await params;
    const body = await req.json();

    const {
      amount,
      type, // 'LENT' | 'BORROWED'
      debtId, // optional specific debt ID
      settlementDate,
      paymentMethodId,
      referenceNumber,
      notes,
      recordAsExpense,
    } = body;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Settlement amount must be a positive number' }, { status: 400 });
    }

    if (type !== 'LENT' && type !== 'BORROWED') {
      return NextResponse.json({ error: 'Type must be either LENT or BORROWED' }, { status: 400 });
    }

    // Resolve contact name or contact ID
    let contactName: string | null = null;
    let contactIdToMatch: string | null = null;

    if (id.startsWith('unlinked_')) {
      const hex = id.replace('unlinked_', '');
      try {
        contactName = Buffer.from(hex, 'hex').toString('utf8');
      } catch {
        return NextResponse.json({ error: 'Invalid contact identifier' }, { status: 400 });
      }
    } else {
      const [contact] = await db
        .select()
        .from(debtContacts)
        .where(eq(debtContacts.id, id))
        .limit(1);

      if (contact) {
        contactIdToMatch = contact.id;
        contactName = contact.name;
      }
    }

    if (!contactName && !contactIdToMatch) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Fetch active debts for this contact matching the debt type
    const queryConditions = [
      eq(debts.type, type),
      sql`CAST(${debts.remainingAmount} AS NUMERIC) > 0.001`,
      sql`${debts.status} NOT IN ('SETTLED', 'CANCELLED')`,
    ];

    if (debtId) {
      queryConditions.push(eq(debts.id, debtId));
    } else {
      // Match by contactId or by contactName
      const nameOrIdConditions = [];
      if (contactIdToMatch) {
        nameOrIdConditions.push(eq(debts.contactId, contactIdToMatch));
      }
      if (contactName) {
        nameOrIdConditions.push(ilike(debts.contactName, contactName));
      }
      if (nameOrIdConditions.length > 0) {
        queryConditions.push(or(...nameOrIdConditions)!);
      }
    }

    const openDebts = await db
      .select()
      .from(debts)
      .where(and(...queryConditions))
      .orderBy(debts.transactionDate);

    if (openDebts.length === 0) {
      return NextResponse.json(
        { error: `No active outstanding ${type.toLowerCase()} debts found for this person.` },
        { status: 400 }
      );
    }

    const totalOutstanding = openDebts.reduce((sum, d) => sum + (Number(d.remainingAmount) || 0), 0);
    if (numAmount > totalOutstanding + 0.01) {
      return NextResponse.json(
        {
          error: `Payment amount (₹${numAmount.toFixed(2)}) exceeds total outstanding balance (₹${totalOutstanding.toFixed(2)})`,
        },
        { status: 400 }
      );
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

    const sDate = settlementDate ? new Date(settlementDate) : new Date();

    // Optional Expense Sync
    let linkedExpenseId: string | null = null;
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
          type === 'BORROWED'
            ? `Debt Repayment to ${contactName || 'Contact'}`
            : `Lent Settlement Received from ${contactName || 'Contact'}`;

        await db.insert(expenses).values({
          id: linkedExpenseId,
          categoryId: cat.id,
          paymentMethodId: paymentMethodId || (await db.select().from(paymentMethods).limit(1))[0]?.id,
          title: expenseTitle,
          description: notes?.trim() || `Settlement of ₹${numAmount} for ${contactName || 'Contact'}`,
          amount: numAmount.toString(),
          expenseDate: sDate,
          referenceNumber: referenceNumber?.trim() || null,
          createdById: sessionUser.id,
        });
      } catch (expErr) {
        console.error('Failed to create linked expense for person settlement:', expErr);
      }
    }

    // Apply settlement in FIFO order across open debts
    let remainingToApply = numAmount;
    const settledDebtsInfo: Array<{ debtId: string; settledAmount: number; remainingAmount: number }> = [];

    for (const debt of openDebts) {
      if (remainingToApply <= 0.001) break;

      const currentRemaining = Number(debt.remainingAmount) || 0;
      const payThisDebt = Math.min(remainingToApply, currentRemaining);

      if (payThisDebt <= 0) continue;

      const settlementId = `dset_${crypto.randomUUID()}`;

      // Insert settlement record
      await db.insert(debtSettlements).values({
        id: settlementId,
        debtId: debt.id,
        amount: payThisDebt.toFixed(2),
        settlementDate: sDate,
        paymentMethodId: paymentMethodId || debt.paymentMethodId || null,
        referenceNumber: referenceNumber?.trim() || null,
        notes: notes?.trim() || `Person balance adjustment installment`,
        expenseId: linkedExpenseId,
        createdById: sessionUser.id,
      });

      const newRemaining = Math.max(0, currentRemaining - payThisDebt);
      const isNowSettled = newRemaining <= 0.001;
      const newStatus = isNowSettled ? 'SETTLED' : 'PARTIALLY_SETTLED';

      await db
        .update(debts)
        .set({
          remainingAmount: newRemaining.toFixed(2),
          status: newStatus,
          settledAt: isNowSettled ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(debts.id, debt.id));

      settledDebtsInfo.push({
        debtId: debt.id,
        settledAmount: payThisDebt,
        remainingAmount: newRemaining,
      });

      remainingToApply -= payThisDebt;
    }

    const newTotalOutstanding = Math.max(0, totalOutstanding - numAmount);

    return NextResponse.json({
      success: true,
      amountSettled: numAmount,
      contactName,
      previousOutstanding: totalOutstanding,
      newTotalOutstanding,
      settledDebts: settledDebtsInfo,
    });
  } catch (error) {
    console.error('Error in POST /api/debts/contacts/[id]/settle:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
