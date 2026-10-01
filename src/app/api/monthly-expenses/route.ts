import { NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  monthlyExpenseTemplates, 
  monthlyExpenseEntries, 
  monthlyExpenseMonthSettings,
  paymentMethods,
  users 
} from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';
import { getAvailableMonths, DEFAULT_TEMPLATES } from '@/lib/monthly-expenses-utils';
import { syncMonthlyBillPaymentToExpenses } from '@/lib/monthly-expenses-sync';

export async function GET(req: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const requestedMonth = searchParams.get('month');

    // 1. Fetch manual unlock settings
    const monthSettingsRecords = await db.select().from(monthlyExpenseMonthSettings);
    const manuallyUnlocked = monthSettingsRecords
      .filter((s) => s.isUnlockedManual === 'true')
      .map((s) => s.month);

    // 2. Compute available months with unlocking rules
    const { months, currentMonthKey, defaultActiveMonth } = getAvailableMonths(
      new Date(),
      manuallyUnlocked
    );

    const activeMonthKey = requestedMonth || defaultActiveMonth;
    const selectedMonthMeta = months.find((m) => m.month === activeMonthKey);

    // 3. Fetch active templates or seed default templates if empty
    let templates = await db
      .select()
      .from(monthlyExpenseTemplates)
      .orderBy(asc(monthlyExpenseTemplates.displayOrder), asc(monthlyExpenseTemplates.createdAt));

    if (templates.length === 0) {
      // Seed default templates
      for (const def of DEFAULT_TEMPLATES) {
        const id = crypto.randomUUID();
        await db.insert(monthlyExpenseTemplates).values({
          id,
          name: def.name,
          defaultAmount: def.defaultAmount,
          dueDay: def.dueDay.toString(),
          category: def.category,
          notes: def.notes,
          isActive: 'true',
          displayOrder: def.displayOrder.toString(),
        });
      }
      templates = await db
        .select()
        .from(monthlyExpenseTemplates)
        .orderBy(asc(monthlyExpenseTemplates.displayOrder), asc(monthlyExpenseTemplates.createdAt));
    }

    // 4. Fetch entries for the active month
    let entries = await db
      .select({
        id: monthlyExpenseEntries.id,
        month: monthlyExpenseEntries.month,
        templateId: monthlyExpenseEntries.templateId,
        name: monthlyExpenseEntries.name,
        category: monthlyExpenseEntries.category,
        expectedAmount: monthlyExpenseEntries.expectedAmount,
        actualAmount: monthlyExpenseEntries.actualAmount,
        dueDay: monthlyExpenseEntries.dueDay,
        status: monthlyExpenseEntries.status,
        paidDate: monthlyExpenseEntries.paidDate,
        paymentMethodId: monthlyExpenseEntries.paymentMethodId,
        paymentMethodName: paymentMethods.name,
        referenceNumber: monthlyExpenseEntries.referenceNumber,
        notes: monthlyExpenseEntries.notes,
        expenseId: monthlyExpenseEntries.expenseId,
        paidById: monthlyExpenseEntries.paidById,
        paidByName: users.name,
        displayOrder: monthlyExpenseEntries.displayOrder,
        createdAt: monthlyExpenseEntries.createdAt,
        updatedAt: monthlyExpenseEntries.updatedAt,
      })
      .from(monthlyExpenseEntries)
      .leftJoin(paymentMethods, eq(monthlyExpenseEntries.paymentMethodId, paymentMethods.id))
      .leftJoin(users, eq(monthlyExpenseEntries.paidById, users.id))
      .where(eq(monthlyExpenseEntries.month, activeMonthKey))
      .orderBy(asc(monthlyExpenseEntries.dueDay), asc(monthlyExpenseEntries.displayOrder), asc(monthlyExpenseEntries.createdAt));

    // If month is unlocked and has no entries, auto-instantiate from active templates
    if (entries.length === 0 && selectedMonthMeta?.isUnlocked) {
      const activeTemplates = templates.filter((t) => t.isActive === 'true');
      for (const tpl of activeTemplates) {
        const entryId = crypto.randomUUID();
        await db.insert(monthlyExpenseEntries).values({
          id: entryId,
          month: activeMonthKey,
          templateId: tpl.id,
          name: tpl.name,
          category: tpl.category,
          expectedAmount: tpl.defaultAmount,
          actualAmount: '0',
          dueDay: tpl.dueDay,
          status: 'PENDING',
          paymentMethodId: tpl.paymentMethodId,
          notes: tpl.notes,
          displayOrder: tpl.displayOrder,
        });
      }

      // Re-fetch populated entries
      entries = await db
        .select({
          id: monthlyExpenseEntries.id,
          month: monthlyExpenseEntries.month,
          templateId: monthlyExpenseEntries.templateId,
          name: monthlyExpenseEntries.name,
          category: monthlyExpenseEntries.category,
          expectedAmount: monthlyExpenseEntries.expectedAmount,
          actualAmount: monthlyExpenseEntries.actualAmount,
          dueDay: monthlyExpenseEntries.dueDay,
          status: monthlyExpenseEntries.status,
          paidDate: monthlyExpenseEntries.paidDate,
          paymentMethodId: monthlyExpenseEntries.paymentMethodId,
          paymentMethodName: paymentMethods.name,
          referenceNumber: monthlyExpenseEntries.referenceNumber,
          notes: monthlyExpenseEntries.notes,
          expenseId: monthlyExpenseEntries.expenseId,
          paidById: monthlyExpenseEntries.paidById,
          paidByName: users.name,
          displayOrder: monthlyExpenseEntries.displayOrder,
          createdAt: monthlyExpenseEntries.createdAt,
          updatedAt: monthlyExpenseEntries.updatedAt,
        })
        .from(monthlyExpenseEntries)
        .leftJoin(paymentMethods, eq(monthlyExpenseEntries.paymentMethodId, paymentMethods.id))
        .leftJoin(users, eq(monthlyExpenseEntries.paidById, users.id))
        .where(eq(monthlyExpenseEntries.month, activeMonthKey))
        .orderBy(asc(monthlyExpenseEntries.dueDay), asc(monthlyExpenseEntries.displayOrder), asc(monthlyExpenseEntries.createdAt));
    }

    // 5. Fetch payment methods
    const activePaymentMethods = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.isActive, 'true'))
      .orderBy(asc(paymentMethods.name));

    // 6. Fetch stats for all unlocked months (to show badges in month tabs)
    const allEntries = await db
      .select({
        month: monthlyExpenseEntries.month,
        status: monthlyExpenseEntries.status,
        expectedAmount: monthlyExpenseEntries.expectedAmount,
        actualAmount: monthlyExpenseEntries.actualAmount,
      })
      .from(monthlyExpenseEntries);

    const monthSummaries: Record<string, { totalItems: number; paidItems: number; totalExpected: number; totalPaid: number }> = {};
    for (const e of allEntries) {
      if (!monthSummaries[e.month]) {
        monthSummaries[e.month] = { totalItems: 0, paidItems: 0, totalExpected: 0, totalPaid: 0 };
      }
      monthSummaries[e.month].totalItems += 1;
      const expected = parseFloat(e.expectedAmount || '0') || 0;
      const actual = parseFloat(e.actualAmount || '0') || 0;
      monthSummaries[e.month].totalExpected += expected;
      if (e.status === 'PAID') {
        monthSummaries[e.month].paidItems += 1;
        monthSummaries[e.month].totalPaid += (actual > 0 ? actual : expected);
      }
    }

    const enhancedMonths = months.map((m) => {
      const summary = monthSummaries[m.month] || { totalItems: 0, paidItems: 0, totalExpected: 0, totalPaid: 0 };
      return {
        ...m,
        totalItems: summary.totalItems,
        paidItems: summary.paidItems,
        totalExpected: summary.totalExpected,
        totalPaid: summary.totalPaid,
        isCompleted: summary.totalItems > 0 && summary.paidItems === summary.totalItems,
      };
    });

    // 7. Active month settings
    const currentMonthSetting = monthSettingsRecords.find((s) => s.month === activeMonthKey) || null;

    // Calculate active month statistics
    let totalExpected = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let paidCount = 0;

    for (const item of entries) {
      const exp = parseFloat(item.expectedAmount || '0') || 0;
      const act = parseFloat(item.actualAmount || '0') || 0;
      totalExpected += exp;
      if (item.status === 'PAID') {
        paidCount++;
        totalPaid += (act > 0 ? act : exp);
      } else if (item.status === 'PENDING') {
        totalPending += exp;
      }
    }

    const progressPercentage = entries.length > 0 ? Math.round((paidCount / entries.length) * 100) : 0;

    return NextResponse.json({
      activeMonth: activeMonthKey,
      selectedMonthMeta,
      months: enhancedMonths,
      currentMonthKey,
      entries,
      templates,
      paymentMethods: activePaymentMethods,
      monthSetting: currentMonthSetting,
      stats: {
        totalItems: entries.length,
        paidCount,
        pendingCount: entries.length - paidCount,
        totalExpected,
        totalPaid,
        totalPending,
        progressPercentage,
      },
    });
  } catch (error) {
    console.error('Error fetching monthly expenses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const session = { user: authResult.user! };

    const body = await req.json();
    const { month, name, category, expectedAmount, dueDay, notes, paymentMethodId, status, actualAmount, paidDate, referenceNumber } = body;

    if (!month || !name?.trim()) {
      return NextResponse.json({ error: 'Month and Name are required' }, { status: 400 });
    }

    const entryId = crypto.randomUUID();
    const isPaid = status === 'PAID';
    const resolvedActualAmount = isPaid && actualAmount ? actualAmount.toString() : (isPaid ? (expectedAmount || '0').toString() : '0');
    const resolvedPaidDate = isPaid ? (paidDate ? new Date(paidDate) : new Date()) : null;

    let linkedExpenseId: string | null = null;
    if (isPaid) {
      linkedExpenseId = await syncMonthlyBillPaymentToExpenses({
        month,
        name: name.trim(),
        category: category || 'OPERATIONAL',
        actualAmount: resolvedActualAmount,
        expectedAmount: expectedAmount || '0',
        dueDay: dueDay ? dueDay.toString() : null,
        paidDate: resolvedPaidDate,
        paymentMethodId: paymentMethodId || null,
        referenceNumber: referenceNumber?.trim() || null,
        notes: notes?.trim() || null,
        userId: session.user.id,
        userName: session.user.name || undefined,
        userEmail: session.user.email || undefined,
      });
    }

    const [newEntry] = await db
      .insert(monthlyExpenseEntries)
      .values({
        id: entryId,
        month,
        name: name.trim(),
        category: category || 'OPERATIONAL',
        expectedAmount: expectedAmount ? expectedAmount.toString() : '0',
        actualAmount: resolvedActualAmount,
        dueDay: dueDay ? dueDay.toString() : null,
        status: isPaid ? 'PAID' : 'PENDING',
        paidDate: resolvedPaidDate,
        paymentMethodId: paymentMethodId || null,
        referenceNumber: referenceNumber?.trim() || null,
        notes: notes?.trim() || null,
        expenseId: linkedExpenseId,
        createdById: session.user.id,
        paidById: isPaid ? session.user.id : null,
      })
      .returning();

    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating monthly expense entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
