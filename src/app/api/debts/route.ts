import { NextResponse } from 'next/server';
import { db } from '@/db';
import { debts, debtSettlements, debtContacts, paymentMethods, users, expenses, expenseCategories } from '@/db/schema';
import { eq, desc, and, ilike, or, sql, inArray } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';
import { hasPermission } from '@/lib/rbac';

export async function GET(req: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (!hasPermission(authResult.role, 'debts:view', authResult.permissions)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to view debts' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const typeFilter = searchParams.get('type') || 'ALL'; // 'ALL', 'BORROWED', 'LENT'
    const statusFilter = searchParams.get('status') || 'ALL'; // 'ALL', 'ACTIVE', 'PARTIALLY_SETTLED', 'SETTLED', 'OVERDUE'
    const categoryFilter = searchParams.get('category') || 'ALL';
    const searchQuery = (searchParams.get('search') || '').trim();

    // 1. Fetch all records for metrics calculation (high-performance aggregate)
    const allDebts = await db
      .select({
        id: debts.id,
        type: debts.type,
        amount: debts.amount,
        remainingAmount: debts.remainingAmount,
        status: debts.status,
        dueDate: debts.dueDate,
        contactName: debts.contactName,
      })
      .from(debts);

    const now = new Date();

    let totalLentPrincipal = 0;
    let totalLentOutstanding = 0;
    let totalBorrowedPrincipal = 0;
    let totalBorrowedOutstanding = 0;
    let overdueCount = 0;
    let overdueAmount = 0;
    let activeCount = 0;
    let settledCount = 0;
    const uniqueBorrowers = new Set<string>();
    const uniqueLenders = new Set<string>();

    for (const d of allDebts) {
      const amt = Number(d.amount) || 0;
      const rem = Number(d.remainingAmount) || 0;
      const isPastDue = d.dueDate ? new Date(d.dueDate) < now : false;
      const isSettled = d.status === 'SETTLED' || rem <= 0.001;

      if (d.type === 'LENT') {
        totalLentPrincipal += amt;
        if (!isSettled && d.status !== 'CANCELLED') {
          totalLentOutstanding += rem;
          uniqueBorrowers.add(d.contactName.trim().toLowerCase());
        }
      } else if (d.type === 'BORROWED') {
        totalBorrowedPrincipal += amt;
        if (!isSettled && d.status !== 'CANCELLED') {
          totalBorrowedOutstanding += rem;
          uniqueLenders.add(d.contactName.trim().toLowerCase());
        }
      }

      if (isSettled) {
        settledCount++;
      } else if (d.status !== 'CANCELLED') {
        activeCount++;
        if (isPastDue) {
          overdueCount++;
          overdueAmount += rem;
        }
      }
    }

    const netPosition = totalLentOutstanding - totalBorrowedOutstanding;

    // 2. Build filtered query for table list
    const conditions = [];

    if (typeFilter !== 'ALL') {
      conditions.push(eq(debts.type, typeFilter));
    }

    if (categoryFilter !== 'ALL') {
      conditions.push(eq(debts.category, categoryFilter));
    }

    if (statusFilter === 'SETTLED') {
      conditions.push(or(eq(debts.status, 'SETTLED'), sql`CAST(${debts.remainingAmount} AS NUMERIC) <= 0.001`));
    } else if (statusFilter === 'ACTIVE') {
      conditions.push(
        and(
          sql`CAST(${debts.remainingAmount} AS NUMERIC) > 0.001`,
          eq(debts.status, 'ACTIVE')
        )
      );
    } else if (statusFilter === 'PARTIALLY_SETTLED') {
      conditions.push(eq(debts.status, 'PARTIALLY_SETTLED'));
    } else if (statusFilter === 'OVERDUE') {
      conditions.push(
        and(
          sql`CAST(${debts.remainingAmount} AS NUMERIC) > 0.001`,
          sql`${debts.dueDate} IS NOT NULL`,
          sql`${debts.dueDate} < ${now.toISOString()}`
        )
      );
    }

    if (searchQuery) {
      conditions.push(
        or(
          ilike(debts.contactName, `%${searchQuery}%`),
          ilike(debts.contactPhone, `%${searchQuery}%`),
          ilike(debts.contactEmail, `%${searchQuery}%`),
          ilike(debts.referenceNumber, `%${searchQuery}%`),
          ilike(debts.notes, `%${searchQuery}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch list with relations
    const rows = await db
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
      .where(whereClause)
      .orderBy(desc(debts.transactionDate), desc(debts.createdAt));

    // Get count of settlements for each debt
    const debtIds = rows.map((r) => r.id);
    const settlementCounts: Record<string, number> = {};
    if (debtIds.length > 0) {
      const counts = await db
        .select({
          debtId: debtSettlements.debtId,
          count: sql<number>`count(*)::int`,
        })
        .from(debtSettlements)
        .where(inArray(debtSettlements.debtId, debtIds))
        .groupBy(debtSettlements.debtId);

      for (const c of counts) {
        settlementCounts[c.debtId] = Number(c.count) || 0;
      }
    }

    const enrichedDebts = rows.map((r) => {
      const isPastDue = r.dueDate ? new Date(r.dueDate) < now : false;
      const isSettled = r.status === 'SETTLED' || Number(r.remainingAmount) <= 0.001;
      let computedStatus = r.status;
      if (!isSettled && isPastDue) {
        computedStatus = 'OVERDUE';
      }

      return {
        ...r,
        computedStatus,
        isOverdue: !isSettled && isPastDue,
        settlementCount: settlementCounts[r.id] || 0,
      };
    });

    return NextResponse.json({
      summary: {
        totalLentPrincipal,
        totalLentOutstanding,
        borrowerCount: uniqueBorrowers.size,
        totalBorrowedPrincipal,
        totalBorrowedOutstanding,
        lenderCount: uniqueLenders.size,
        netPosition, // Positive = net receivable (people owe you more), Negative = net payable (you owe more)
        overdueCount,
        overdueAmount,
        activeCount,
        settledCount,
        totalCount: allDebts.length,
      },
      debts: enrichedDebts,
    });
  } catch (error) {
    console.error('Error in GET /api/debts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (!hasPermission(authResult.role, 'debts:manage', authResult.permissions)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to create debts' }, { status: 403 });
    }

    const sessionUser = authResult.user!;
    const body = await req.json();

    const {
      type,
      contactId: rawContactId,
      contactName,
      contactPhone,
      contactEmail,
      category,
      amount,
      transactionDate,
      dueDate,
      paymentMethodId,
      referenceNumber,
      notes,
      recordAsExpense,
      saveContact,
    } = body;

    if (!type || (type !== 'BORROWED' && type !== 'LENT')) {
      return NextResponse.json({ error: 'Type must be either BORROWED or LENT' }, { status: 400 });
    }

    if (!contactName || !contactName.trim()) {
      return NextResponse.json({ error: 'Contact name is required' }, { status: 400 });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
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

    // Resolve or auto-register contact in debtContacts
    let resolvedContactId: string | null = rawContactId || null;
    const cleanName = contactName.trim();

    if (!resolvedContactId) {
      // Check if contact already exists by name
      const [existingContact] = await db
        .select({ id: debtContacts.id })
        .from(debtContacts)
        .where(ilike(debtContacts.name, cleanName))
        .limit(1);

      if (existingContact) {
        resolvedContactId = existingContact.id;
      } else if (saveContact) {
        // Auto-create contact entry
        const newCId = `dc_${crypto.randomUUID()}`;
        const [createdContact] = await db
          .insert(debtContacts)
          .values({
            id: newCId,
            name: cleanName,
            phone: contactPhone?.trim() || null,
            email: contactEmail?.trim() || null,
            category: (category?.trim() || 'GENERAL').toUpperCase(),
            createdById: sessionUser.id,
          })
          .returning();
        resolvedContactId = createdContact.id;
      }
    }

    const debtId = `debt_${crypto.randomUUID()}`;
    const txDate = transactionDate ? new Date(transactionDate) : new Date();
    const dDate = dueDate ? new Date(dueDate) : null;

    const [newDebt] = await db
      .insert(debts)
      .values({
        id: debtId,
        type,
        contactId: resolvedContactId,
        contactName: cleanName,
        contactPhone: contactPhone?.trim() || null,
        contactEmail: contactEmail?.trim() || null,
        category: (category?.trim() || 'GENERAL').toUpperCase(),
        amount: numAmount.toString(),
        remainingAmount: numAmount.toString(),
        transactionDate: txDate,
        dueDate: dDate,
        paymentMethodId: paymentMethodId || null,
        status: 'ACTIVE',
        referenceNumber: referenceNumber?.trim() || null,
        notes: notes?.trim() || null,
        createdById: sessionUser.id,
      })
      .returning();

    // Optionally create an expense if requested (e.g. money lent out treated as operational advance / cash out)
    if (recordAsExpense && type === 'LENT') {
      try {
        // Find or create 'Lending / Debt Advance' category
        let [cat] = await db
          .select({ id: expenseCategories.id })
          .from(expenseCategories)
          .where(ilike(expenseCategories.name, 'Debt & Advances'))
          .limit(1);

        if (!cat) {
          const newCatId = crypto.randomUUID();
          await db.insert(expenseCategories).values({
            id: newCatId,
            code: 'DEBT_ADVANCES',
            name: 'Debt & Advances',
            description: 'Funds lent out to contacts, partners, or vendors',
          });
          cat = { id: newCatId };
        }

        const expenseId = crypto.randomUUID();
        await db.insert(expenses).values({
          id: expenseId,
          categoryId: cat.id,
          paymentMethodId: paymentMethodId || (await db.select().from(paymentMethods).limit(1))[0]?.id,
          title: `Lent to ${contactName.trim()}`,
          description: notes?.trim() || `Lent ₹${numAmount} to ${contactName.trim()}`,
          amount: numAmount.toString(),
          expenseDate: txDate,
          referenceNumber: referenceNumber?.trim() || null,
          createdById: sessionUser.id,
        });
      } catch (expErr) {
        console.error('Failed to auto-create linked expense:', expErr);
        // Do not fail the debt creation if expense creation fails
      }
    }

    return NextResponse.json(newDebt, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/debts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

