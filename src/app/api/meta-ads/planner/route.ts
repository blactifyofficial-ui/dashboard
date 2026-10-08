import { NextResponse } from 'next/server';
import { db } from '@/db';
import { metaAdsDailyPlans, metaAdsSettings } from '@/db/schema';
import { eq, like, desc, sql } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';
import { hasPermission } from '@/lib/rbac';

// Ensure table exists safely
let isTableInitialized = false;
async function ensureDailyPlansTable() {
  if (isTableInitialized) return;
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "meta_ads_daily_plans" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "date" TEXT NOT NULL,
        "total_budget" NUMERIC DEFAULT '0' NOT NULL,
        "campaign_count" NUMERIC DEFAULT '1' NOT NULL,
        "distribution_mode" TEXT DEFAULT 'ALL_SAME' NOT NULL,
        "campaigns" TEXT DEFAULT '[]' NOT NULL,
        "status" TEXT DEFAULT 'IN_PROGRESS' NOT NULL,
        "notes" TEXT,
        "created_by_id" TEXT,
        "updated_by_id" TEXT,
        "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
        CONSTRAINT "meta_ads_daily_plans_date_unique" UNIQUE ("date")
      );
    `);
    isTableInitialized = true;
  } catch (err) {
    console.error('Error verifying meta_ads_daily_plans table:', err);
  }
}

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (!hasPermission(authResult.role, 'meta_ads:view', authResult.permissions)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    await ensureDailyPlansTable();

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // e.g. "2026-10"
    const selectedDate = searchParams.get('date'); // e.g. "2026-10-08"

    // 1. Fetch settings to get default daily budget
    const [setting] = await db.select().from(metaAdsSettings).where(eq(metaAdsSettings.id, 'default')).limit(1);
    const defaultDailyBudget = setting ? parseFloat(setting.dailyBudget) || 0 : 0;
    const defaultDays = setting ? parseInt(setting.days || '7', 10) : 7;
    const defaultWeeklyBudget = defaultDailyBudget * defaultDays;
    const defaultMonthlyBudget = defaultDailyBudget * 30;

    // 2. Query month plans if month param is provided
    let plans = [];

    if (month) {
      plans = await db
        .select()
        .from(metaAdsDailyPlans)
        .where(like(metaAdsDailyPlans.date, `${month}%`))
        .orderBy(metaAdsDailyPlans.date);
    } else {
      plans = await db
        .select()
        .from(metaAdsDailyPlans)
        .orderBy(desc(metaAdsDailyPlans.date))
        .limit(90);
    }

    // 3. Find plan for selectedDate
    let selectedPlan = null;
    if (selectedDate) {
      const found = plans.find((p) => p.date === selectedDate);
      if (found) {
        selectedPlan = found;
      } else {
        const [direct] = await db
          .select()
          .from(metaAdsDailyPlans)
          .where(eq(metaAdsDailyPlans.date, selectedDate))
          .limit(1);
        selectedPlan = direct || null;
      }
    }

    // 4. Calculate month statistics & budget balances
    let totalPlannedMonth = 0;
    let totalDoneMonth = 0;
    let plannedDaysCount = 0;
    let doneDaysCount = 0;

    for (const plan of plans) {
      const b = parseFloat(plan.totalBudget) || 0;
      totalPlannedMonth += b;
      plannedDaysCount++;
      if (plan.status === 'DONE') {
        totalDoneMonth += b;
        doneDaysCount++;
      }
    }

    return NextResponse.json({
      success: true,
      plans,
      selectedPlan,
      monthStats: {
        totalPlannedMonth,
        totalDoneMonth,
        plannedDaysCount,
        doneDaysCount,
      },
      settings: {
        dailyBudget: defaultDailyBudget,
        days: defaultDays,
        weeklyBudget: defaultWeeklyBudget,
        monthlyBudgetEstimate: defaultMonthlyBudget,
      },
    });
  } catch (error) {
    console.error('Failed to get daily plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Meta Ads daily plans' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const canEdit =
      hasPermission(authResult.role, 'meta_ads:manage_planner', authResult.permissions) ||
      hasPermission(authResult.role, 'meta_ads:edit', authResult.permissions);

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to edit daily planner' },
        { status: 403 }
      );
    }

    await ensureDailyPlansTable();

    const body = await request.json();
    const {
      date,
      totalBudget,
      campaignCount,
      distributionMode = 'ALL_SAME',
      campaigns = [],
      status = 'IN_PROGRESS',
      notes = '',
    } = body;

    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Expected YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    const numericTotalBudget = Math.max(0, parseFloat(totalBudget) || 0).toString();
    const numericCampaignCount = Math.max(1, parseInt(campaignCount, 10) || 1).toString();
    const safeCampaignsJson = typeof campaigns === 'string' ? campaigns : JSON.stringify(campaigns);

    const safeStatus = ['IN_PROGRESS', 'DONE', 'NOT_DONE'].includes(status)
      ? status
      : 'IN_PROGRESS';
    const safeDistributionMode = distributionMode === 'DIFFERENT' ? 'DIFFERENT' : 'ALL_SAME';

    const newId = crypto.randomUUID();

    const [savedPlan] = await db
      .insert(metaAdsDailyPlans)
      .values({
        id: newId,
        date,
        totalBudget: numericTotalBudget,
        campaignCount: numericCampaignCount,
        distributionMode: safeDistributionMode,
        campaigns: safeCampaignsJson,
        status: safeStatus,
        notes: notes || '',
        createdById: authResult.user?.id,
        updatedById: authResult.user?.id,
      })
      .onConflictDoUpdate({
        target: metaAdsDailyPlans.date,
        set: {
          totalBudget: numericTotalBudget,
          campaignCount: numericCampaignCount,
          distributionMode: safeDistributionMode,
          campaigns: safeCampaignsJson,
          status: safeStatus,
          notes: notes || '',
          updatedById: authResult.user?.id,
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json({
      success: true,
      plan: savedPlan,
    });
  } catch (error) {
    console.error('Failed to save daily plan:', error);
    return NextResponse.json(
      { error: 'Failed to save daily plan' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const canEdit =
      hasPermission(authResult.role, 'meta_ads:manage_planner', authResult.permissions) ||
      hasPermission(authResult.role, 'meta_ads:edit', authResult.permissions);

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to delete daily plan' },
        { status: 403 }
      );
    }

    await ensureDailyPlansTable();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    await db.delete(metaAdsDailyPlans).where(eq(metaAdsDailyPlans.date, date));

    return NextResponse.json({ success: true, message: 'Plan removed' });
  } catch (error) {
    console.error('Failed to delete daily plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete daily plan' },
      { status: 500 }
    );
  }
}
