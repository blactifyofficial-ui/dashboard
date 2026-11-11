import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dailySavingsSettings, expenseCategories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';
import { hasPermission } from '@/lib/rbac';

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (authResult.error || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: authResult.status || 401 });
    }

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

    const categories = await db
      .select({
        id: expenseCategories.id,
        name: expenseCategories.name,
        code: expenseCategories.code,
      })
      .from(expenseCategories)
      .where(eq(expenseCategories.isActive, 'true'));

    return NextResponse.json({ settings, categories });
  } catch (error) {
    console.error('Error in GET /api/savings/settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult.error || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: authResult.status || 401 });
    }

    if (!hasPermission(authResult.role, 'savings:manage', authResult.permissions)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to update settings' }, { status: 403 });
    }

    const body = await req.json();
    const { dailyTarget, monthlyTarget, mirrorToExpenses, expenseCategoryId, currency } = body;

    const updateData: Partial<typeof dailySavingsSettings.$inferInsert> = {
      updatedById: authResult.user.id,
      updatedAt: new Date(),
    };

    if (dailyTarget !== undefined) updateData.dailyTarget = Number(dailyTarget).toString();
    if (monthlyTarget !== undefined) updateData.monthlyTarget = Number(monthlyTarget).toString();
    if (mirrorToExpenses !== undefined) updateData.mirrorToExpenses = mirrorToExpenses ? 'true' : 'false';
    if (expenseCategoryId !== undefined) updateData.expenseCategoryId = expenseCategoryId || null;
    if (currency !== undefined) updateData.currency = currency;

    const [updated] = await db
      .insert(dailySavingsSettings)
      .values({
        id: 'default',
        dailyTarget: updateData.dailyTarget || '500',
        monthlyTarget: updateData.monthlyTarget || '15000',
        mirrorToExpenses: updateData.mirrorToExpenses || 'false',
        currency: updateData.currency || 'INR',
        updatedById: authResult.user.id,
      })
      .onConflictDoUpdate({
        target: dailySavingsSettings.id,
        set: updateData,
      })
      .returning();

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error('Error in PUT /api/savings/settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

