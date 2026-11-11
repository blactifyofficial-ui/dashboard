import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dailySavings, dailySavingsSettings, paymentMethods, users, expenses, expenseCategories } from '@/db/schema';
import { eq, sql, ilike } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';
import { hasPermission } from '@/lib/rbac';

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function calculateStreaks(allDates: string[], todayStr: string): { currentStreak: number; bestStreak: number } {
  if (allDates.length === 0) return { currentStreak: 0, bestStreak: 0 };

  const dateSet = new Set(allDates);

  // Calculate Current Streak
  let currentStreak = 0;
  const today = new Date(todayStr + 'T00:00:00');
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  const checkDate = dateSet.has(todayStr) ? new Date(today) : (dateSet.has(yesterdayStr) ? new Date(yesterday) : null);

  if (checkDate) {
    while (true) {
      const checkStr = getLocalDateString(checkDate);
      if (dateSet.has(checkStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate Best Streak
  const sortedDates = Array.from(dateSet).sort();
  let bestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dStr of sortedDates) {
    const curDate = new Date(dStr + 'T00:00:00');
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    if (tempStreak > bestStreak) {
      bestStreak = tempStreak;
    }
    prevDate = curDate;
  }

  return { currentStreak, bestStreak };
}

export async function GET(req: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult.error || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: authResult.status || 401 });
    }

    if (!hasPermission(authResult.role, 'savings:view', authResult.permissions)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to view savings' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const todayStr = getLocalDateString();
    const currentMonth = todayStr.substring(0, 7); // 'YYYY-MM'
    const targetMonth = searchParams.get('month') || currentMonth;

    // 1. Fetch settings
    let [settings] = await db.select().from(dailySavingsSettings).limit(1);
    if (!settings) {
      const [newSettings] = await db
        .insert(dailySavingsSettings)
        .values({
          id: 'default',
          dailyTarget: '500',
          monthlyTarget: '15000',
          currency: 'INR',
          mirrorToExpenses: 'false',
        })
        .returning();
      settings = newSettings;
    }

    // 2. Fetch all entries for streak calculation
    const allEntriesRaw = await db
      .select({
        date: dailySavings.date,
        amount: dailySavings.amount,
      })
      .from(dailySavings);

    const allDates = allEntriesRaw.map((e) => e.date);
    const { currentStreak, bestStreak } = calculateStreaks(allDates, todayStr);

    // 3. Fetch entries for the selected month
    const monthEntries = await db
      .select({
        id: dailySavings.id,
        date: dailySavings.date,
        amount: dailySavings.amount,
        targetAmount: dailySavings.targetAmount,
        destination: dailySavings.destination,
        paymentMethodId: dailySavings.paymentMethodId,
        paymentMethodName: paymentMethods.name,
        note: dailySavings.note,
        expenseId: dailySavings.expenseId,
        createdAt: dailySavings.createdAt,
        updatedAt: dailySavings.updatedAt,
      })
      .from(dailySavings)
      .leftJoin(paymentMethods, eq(dailySavings.paymentMethodId, paymentMethods.id))
      .where(sql`${dailySavings.date} LIKE ${targetMonth + '%'}`)
      .orderBy(dailySavings.date);

    // 4. Calculate summary metrics
    const [yearStr, monthNumStr] = targetMonth.split('-');
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthNumStr, 10);
    const daysInMonth = getDaysInMonth(year, monthNum);

    let totalSaved = 0;
    const destinations: Record<string, number> = {
      BANK_ACCOUNT: 0,
      CASH: 0,
      EMERGENCY_FUND: 0,
      INVESTMENT: 0,
    };

    let todayEntry: typeof monthEntries[0] | null = null;

    for (const entry of monthEntries) {
      const amt = Number(entry.amount) || 0;
      totalSaved += amt;

      const dest = entry.destination || 'BANK_ACCOUNT';
      destinations[dest] = (destinations[dest] || 0) + amt;

      if (entry.date === todayStr) {
        todayEntry = entry;
      }
    }

    // If today is in another month but not in monthEntries, check if today is logged
    if (!todayEntry && targetMonth !== currentMonth) {
      const [todayRecord] = await db
        .select({
          id: dailySavings.id,
          date: dailySavings.date,
          amount: dailySavings.amount,
          targetAmount: dailySavings.targetAmount,
          destination: dailySavings.destination,
          paymentMethodId: dailySavings.paymentMethodId,
          paymentMethodName: paymentMethods.name,
          note: dailySavings.note,
          expenseId: dailySavings.expenseId,
          createdAt: dailySavings.createdAt,
          updatedAt: dailySavings.updatedAt,
        })
        .from(dailySavings)
        .leftJoin(paymentMethods, eq(dailySavings.paymentMethodId, paymentMethods.id))
        .where(eq(dailySavings.date, todayStr))
        .limit(1);

      if (todayRecord) {
        todayEntry = todayRecord;
      }
    }

    const dailyTarget = Number(settings.dailyTarget) || 500;
    const monthlyTarget = Number(settings.monthlyTarget) || dailyTarget * daysInMonth;
    const daysSaved = monthEntries.length;
    const completionRate = monthlyTarget > 0 ? Math.min(100, Math.round((totalSaved / monthlyTarget) * 100)) : 0;
    const averageDaily = daysSaved > 0 ? Math.round(totalSaved / daysSaved) : 0;

    // 5. Fetch available active payment methods
    const activePaymentMethods = await db
      .select({
        id: paymentMethods.id,
        name: paymentMethods.name,
        code: paymentMethods.code,
      })
      .from(paymentMethods)
      .where(eq(paymentMethods.isActive, 'true'))
      .orderBy(paymentMethods.name);

    return NextResponse.json({
      entries: monthEntries,
      todayStr,
      targetMonth,
      todayEntry,
      summary: {
        totalSaved,
        monthlyTarget,
        dailyTarget,
        daysSaved,
        daysInMonth,
        completionRate,
        currentStreak,
        bestStreak,
        averageDaily,
        destinations,
      },
      settings,
      paymentMethods: activePaymentMethods,
    });
  } catch (error) {
    console.error('Error in GET /api/savings:', error);
    return NextResponse.json({ error: 'Failed to fetch daily savings data' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult.error || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: authResult.status || 401 });
    }

    if (!hasPermission(authResult.role, 'savings:manage', authResult.permissions)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to record savings' }, { status: 403 });
    }

    const sessionUser = authResult.user;
    const body = await req.json();

    const {
      date,
      amount,
      destination = 'BANK_ACCOUNT',
      paymentMethodId,
      note,
      mirrorToExpenses = false,
    } = body;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Valid date in YYYY-MM-DD format is required' }, { status: 400 });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Savings amount must be greater than 0' }, { status: 400 });
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

    // Fetch settings for targets
    const [settings] = await db.select().from(dailySavingsSettings).limit(1);
    const targetAmount = settings?.dailyTarget || '500';

    // Check if an entry already exists for this date
    const [existing] = await db
      .select()
      .from(dailySavings)
      .where(eq(dailySavings.date, date))
      .limit(1);

    let linkedExpenseId: string | null = existing?.expenseId || null;

    // Handle optional mirror to expenses
    const shouldMirror = mirrorToExpenses || settings?.mirrorToExpenses === 'true';
    if (shouldMirror) {
      try {
        let [cat] = await db
          .select({ id: expenseCategories.id })
          .from(expenseCategories)
          .where(ilike(expenseCategories.name, 'Savings & Reserves'))
          .limit(1);

        if (!cat) {
          const newCatId = crypto.randomUUID();
          await db.insert(expenseCategories).values({
            id: newCatId,
            code: 'SAVINGS_RESERVES',
            name: 'Savings & Reserves',
            description: 'Daily savings put aside for reserves, emergency funds, or capital investment',
          });
          cat = { id: newCatId };
        }

        const txDate = new Date(date + 'T12:00:00');

        if (linkedExpenseId) {
          // Update existing expense
          await db
            .update(expenses)
            .set({
              amount: numAmount.toString(),
              description: note?.trim() || `Daily saving set aside on ${date}`,
              paymentMethodId: paymentMethodId || null,
              expenseDate: txDate,
              updatedById: sessionUser.id,
              updatedAt: new Date(),
            })
            .where(eq(expenses.id, linkedExpenseId));
        } else {
          // Create new expense
          linkedExpenseId = crypto.randomUUID();
          await db.insert(expenses).values({
            id: linkedExpenseId,
            categoryId: cat.id,
            paymentMethodId: paymentMethodId || (await db.select().from(paymentMethods).limit(1))[0]?.id,
            title: `Daily Saving: ${date}`,
            description: note?.trim() || `Daily saving set aside on ${date}`,
            amount: numAmount.toString(),
            expenseDate: txDate,
            createdById: sessionUser.id,
          });
        }
      } catch (expErr) {
        console.error('Failed to mirror saving to expenses:', expErr);
      }
    }

    let savedResult;
    if (existing) {
      // Update existing record
      const [updated] = await db
        .update(dailySavings)
        .set({
          amount: numAmount.toString(),
          targetAmount,
          destination,
          paymentMethodId: paymentMethodId || null,
          note: note?.trim() || null,
          expenseId: linkedExpenseId,
          updatedById: sessionUser.id,
          updatedAt: new Date(),
        })
        .where(eq(dailySavings.id, existing.id))
        .returning();
      savedResult = updated;
    } else {
      // Create new record
      const newId = crypto.randomUUID();
      const [created] = await db
        .insert(dailySavings)
        .values({
          id: newId,
          date,
          amount: numAmount.toString(),
          targetAmount,
          destination,
          paymentMethodId: paymentMethodId || null,
          note: note?.trim() || null,
          expenseId: linkedExpenseId,
          createdById: sessionUser.id,
          updatedById: sessionUser.id,
        })
        .returning();
      savedResult = created;
    }

    return NextResponse.json({
      success: true,
      data: savedResult,
    });
  } catch (error) {
    console.error('Error in POST /api/savings:', error);
    return NextResponse.json({ error: 'Failed to record daily saving' }, { status: 500 });
  }
}

