import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { getOrCompileMonthlyReport } from '@/lib/financial-report-service';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ month: string }> }
) {
  const authRes = await requirePermission('reports:view');
  if (authRes.error) {
    return NextResponse.json({ error: authRes.error }, { status: authRes.status || 401 });
  }

  const { month } = await props.params;

  try {
    const report = await getOrCompileMonthlyReport(month);
    return NextResponse.json(report);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch monthly report';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

