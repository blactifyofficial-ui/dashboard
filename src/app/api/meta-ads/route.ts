import { NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  metaAdsSettings, 
  metaAdsTransactions, 
  expenses, 
  expenseActivities, 
  expenseCategories, 
  paymentMethods, 
  users 
} from '@/db/schema';
import { eq, desc, ilike, or } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';

async function getOrCreateMetaAdsCategory() {
  const existing = await db
    .select()
    .from(expenseCategories)
    .where(or(ilike(expenseCategories.name, '%meta%ads%'), ilike(expenseCategories.code, '%META_ADS%')))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  const newId = crypto.randomUUID();
  await db.insert(expenseCategories).values({
    id: newId,
    code: 'META_ADS',
    name: 'Meta Ads',
    description: 'Expenses related to advertising campaigns on Facebook and Instagram.',
    isActive: 'true',
  });
  return newId;
}

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // 1. Fetch or initialize settings
    let [setting] = await db.select().from(metaAdsSettings).where(eq(metaAdsSettings.id, 'default')).limit(1);
    if (!setting) {
      [setting] = await db.insert(metaAdsSettings).values({
        id: 'default',
        dailyBudget: '0',
        weeklyBudget: '0',
        currency: 'INR',
        notes: '',
      }).onConflictDoNothing().returning();

      if (!setting) {
        [setting] = await db.select().from(metaAdsSettings).where(eq(metaAdsSettings.id, 'default')).limit(1);
      }
    }

    // 2. Fetch all transactions with joined payment method and creator
    const transactions = await db
      .select({
        id: metaAdsTransactions.id,
        weekStartDate: metaAdsTransactions.weekStartDate,
        weekEndDate: metaAdsTransactions.weekEndDate,
        dailyBudget: metaAdsTransactions.dailyBudget,
        calculatedWeeklyBudget: metaAdsTransactions.calculatedWeeklyBudget,
        amountPaid: metaAdsTransactions.amountPaid,
        paymentDate: metaAdsTransactions.paymentDate,
        paymentMethodId: metaAdsTransactions.paymentMethodId,
        paymentMethodName: paymentMethods.name,
        paymentMethodCode: paymentMethods.code,
        status: metaAdsTransactions.status,
        referenceNumber: metaAdsTransactions.referenceNumber,
        notes: metaAdsTransactions.notes,
        expenseId: metaAdsTransactions.expenseId,
        createdById: metaAdsTransactions.createdById,
        creatorName: users.name,
        createdAt: metaAdsTransactions.createdAt,
        updatedAt: metaAdsTransactions.updatedAt,
      })
      .from(metaAdsTransactions)
      .leftJoin(paymentMethods, eq(metaAdsTransactions.paymentMethodId, paymentMethods.id))
      .leftJoin(users, eq(metaAdsTransactions.createdById, users.id))
      .orderBy(desc(metaAdsTransactions.paymentDate), desc(metaAdsTransactions.createdAt));

    // 3. Fetch active payment methods
    const activePaymentMethods = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.isActive, 'true'));

    // 4. Calculate summary stats
    const totalPaid = transactions
      .filter(t => t.status === 'PAID')
      .reduce((sum, t) => sum + parseFloat(t.amountPaid || '0'), 0);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const thisMonthPaid = transactions
      .filter(t => {
        if (t.status !== 'PAID') return false;
        const d = new Date(t.paymentDate);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
      .reduce((sum, t) => sum + parseFloat(t.amountPaid || '0'), 0);

    const dailyBudgetNum = parseFloat(setting?.dailyBudget || '0');
    const daysNum = setting?.days ? parseInt(setting.days, 10) : 7;
    const weeklyBudgetNum = parseFloat(setting?.weeklyBudget || '0') || (dailyBudgetNum * daysNum);
    const monthlyBudgetEstimate = dailyBudgetNum * 30;

    return NextResponse.json({
      settings: {
        ...setting,
        dailyBudget: dailyBudgetNum,
        days: daysNum,
        weeklyBudget: weeklyBudgetNum,
        monthlyBudgetEstimate,
      },
      transactions,
      paymentMethods: activePaymentMethods,
      summary: {
        dailyBudget: dailyBudgetNum,
        days: daysNum,
        weeklyBudget: weeklyBudgetNum,
        monthlyBudgetEstimate,
        totalPaid,
        thisMonthPaid,
        transactionCount: transactions.length,
      }
    });
  } catch (error) {
    console.error('Error fetching meta ads data:', error);
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
    const {
      weekStartDate,
      weekEndDate,
      dailyBudget,
      calculatedWeeklyBudget,
      amountPaid,
      paymentDate,
      paymentMethodId,
      referenceNumber,
      notes,
      syncToExpenses = true,
    } = body;

    if (!weekStartDate || !weekEndDate || !amountPaid || !paymentDate || !paymentMethodId) {
      return NextResponse.json({ error: 'Missing required transaction fields' }, { status: 400 });
    }

    if (isNaN(Number(amountPaid)) || Number(amountPaid) <= 0) {
      return NextResponse.json({ error: 'Amount paid must be a positive number' }, { status: 400 });
    }

    // Ensure session user exists in "user" table
    await db.insert(users).values({
      id: session.user.id,
      name: session.user.name || '',
      email: session.user.email || '',
    }).onConflictDoUpdate({
      target: users.id,
      set: {
        name: session.user.name || '',
        email: session.user.email || '',
      }
    });

    const transactionId = crypto.randomUUID();
    let expenseId: string | null = null;

    if (syncToExpenses) {
      const categoryId = await getOrCreateMetaAdsCategory();
      expenseId = crypto.randomUUID();

      const startDateObj = new Date(weekStartDate);
      const endDateObj = new Date(weekEndDate);
      const startStr = startDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      const endStr = endDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const expenseTitle = `Meta Ads Weekly Budget (${startStr} - ${endStr})`;

      const expenseDescription = [
        `Period: ${startStr} to ${endStr}`,
        dailyBudget ? `Daily Budget: ₹${Number(dailyBudget).toLocaleString()}` : null,
        calculatedWeeklyBudget ? `Calculated Weekly: ₹${Number(calculatedWeeklyBudget).toLocaleString()}` : null,
        referenceNumber ? `Ref: ${referenceNumber}` : null,
        notes ? `Notes: ${notes}` : null,
      ].filter(Boolean).join(' | ');

      // Insert expense record
      await db.insert(expenses).values({
        id: expenseId,
        categoryId,
        paymentMethodId,
        title: expenseTitle,
        description: expenseDescription,
        amount: Number(amountPaid).toFixed(2),
        expenseDate: new Date(paymentDate),
        referenceNumber: referenceNumber?.trim() || null,
        createdById: session.user.id,
      });

      // Insert expense activity
      await db.insert(expenseActivities).values({
        id: crypto.randomUUID(),
        expenseId,
        actorId: session.user.id,
        activityType: 'CREATED',
        newValue: Number(amountPaid).toFixed(2),
        remark: `Auto-recorded from Meta Ads payment (${startStr} - ${endStr})`,
      });
    }

    // Insert transaction
    const [transaction] = await db.insert(metaAdsTransactions).values({
      id: transactionId,
      weekStartDate: new Date(weekStartDate),
      weekEndDate: new Date(weekEndDate),
      dailyBudget: dailyBudget ? String(dailyBudget) : '0',
      calculatedWeeklyBudget: calculatedWeeklyBudget ? String(calculatedWeeklyBudget) : String(amountPaid),
      amountPaid: String(amountPaid),
      paymentDate: new Date(paymentDate),
      paymentMethodId,
      status: 'PAID',
      referenceNumber: referenceNumber?.trim() || null,
      notes: notes?.trim() || null,
      expenseId,
      createdById: session.user.id,
    }).returning();

    return NextResponse.json({
      success: true,
      transaction,
      syncedExpenseId: expenseId,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating meta ads transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
