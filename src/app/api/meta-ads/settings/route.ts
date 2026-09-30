import { NextResponse } from 'next/server';
import { db } from '@/db';
import { metaAdsSettings, users } from '@/db/schema';
import { requireAuth } from '@/lib/auth-utils';

export async function PUT(req: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const session = { user: authResult.user! };

    const body = await req.json();
    const { dailyBudget, days = 7, currency = 'INR', notes = '' } = body;

    if (dailyBudget === undefined || dailyBudget === null || isNaN(Number(dailyBudget)) || Number(dailyBudget) < 0) {
      return NextResponse.json({ error: 'Daily budget must be a non-negative number' }, { status: 400 });
    }

    const dailyBudgetNum = Number(dailyBudget);
    const daysNum = Math.max(1, parseInt(String(days), 10) || 7);
    const periodBudgetNum = dailyBudgetNum * daysNum;

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

    const [updated] = await db.insert(metaAdsSettings).values({
      id: 'default',
      dailyBudget: dailyBudgetNum.toString(),
      days: daysNum.toString(),
      weeklyBudget: periodBudgetNum.toString(),
      currency,
      notes: notes?.trim() || null,
      updatedById: session.user.id,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: metaAdsSettings.id,
      set: {
        dailyBudget: dailyBudgetNum.toString(),
        days: daysNum.toString(),
        weeklyBudget: periodBudgetNum.toString(),
        currency,
        notes: notes?.trim() || null,
        updatedById: session.user.id,
        updatedAt: new Date(),
      }
    }).returning();

    return NextResponse.json({
      success: true,
      settings: {
        ...updated,
        dailyBudget: dailyBudgetNum,
        days: daysNum,
        weeklyBudget: periodBudgetNum,
        monthlyBudgetEstimate: dailyBudgetNum * 30,
      }
    });
  } catch (error) {
    console.error('Error updating meta ads settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
