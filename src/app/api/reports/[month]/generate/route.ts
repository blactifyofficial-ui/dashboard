import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { compileMonthlyFinancialReport } from '@/lib/financial-report-service';
import { isFirstWeekOfMonth } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ month: string }> }
) {
  const authRes = await requirePermission('reports:generate');
  if (authRes.error) {
    return NextResponse.json({ error: authRes.error }, { status: authRes.status || 401 });
  }

  // Monthly Financial Reports are only available during the 1st week of every month (Days 1–7)
  if (!isFirstWeekOfMonth()) {
    return NextResponse.json(
      { error: 'Monthly financial reports are only available during the 1st week of every month (Days 1–7).' },
      { status: 403 }
    );
  }

  const { month } = await props.params;

  try {
    const report = await compileMonthlyFinancialReport(month, {
      saveToDb: true,
      createdById: authRes.user?.id,
    });

    return NextResponse.json({
      message: `Report for ${month} compiled successfully`,
      report,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate monthly report';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

