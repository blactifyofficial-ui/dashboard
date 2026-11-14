import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { listMonthlyFinancialReports } from '@/lib/financial-report-service';
import { isFirstWeekOfMonth } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  const authRes = await requirePermission('reports:view');
  if (authRes.error) {
    return NextResponse.json({ error: authRes.error }, { status: authRes.status || 401 });
  }

  // Monthly Financial Reports are only available during the 1st week of every month (Days 1–7)
  if (!isFirstWeekOfMonth()) {
    return NextResponse.json({
      reports: [],
      isFirstWeek: false,
      message: 'Monthly financial reports are only available during the 1st week of every month (Days 1–7).',
    });
  }

  try {
    const data = await listMonthlyFinancialReports();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch reports list';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


