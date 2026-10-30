import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { listMonthlyFinancialReports } from '@/lib/financial-report-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authRes = await requirePermission('reports:view');
  if (authRes.error) {
    return NextResponse.json({ error: authRes.error }, { status: authRes.status || 401 });
  }

  try {
    const data = await listMonthlyFinancialReports();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch reports list';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

