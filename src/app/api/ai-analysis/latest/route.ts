import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { hasPermission } from '@/lib/rbac';
import { db } from '@/db';
import { aiAnalysisReports } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { aggregateFinancialData, TimeframeOption } from '@/lib/ai/financial-aggregator';
import { AiStrategicReport } from '@/lib/ai/prompts';

export async function GET(req: NextRequest) {
  try {
    const authRes = await requireAuth();
    if (authRes.error || !authRes.user) {
      return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: authRes.status || 401 });
    }

    if (!hasPermission(authRes.role, 'ai_analysis:view', authRes.permissions)) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to view AI strategic reports' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const timeframe = (searchParams.get('timeframe') as TimeframeOption) || '30d';
    const focusArea = searchParams.get('focusArea') || 'ALL';

    const [latest] = await db
      .select()
      .from(aiAnalysisReports)
      .where(
        and(
          eq(aiAnalysisReports.timeframe, timeframe),
          eq(aiAnalysisReports.focusArea, focusArea)
        )
      )
      .orderBy(desc(aiAnalysisReports.createdAt))
      .limit(1);

    if (latest) {
      return NextResponse.json({
        hasReport: true,
        report: JSON.parse(latest.reportJson) as AiStrategicReport,
        snapshot: JSON.parse(latest.metricsSnapshot),
        createdAt: latest.createdAt,
      });
    }

    // If no report has been generated yet, return the live calculated ledger snapshot
    const snapshot = await aggregateFinancialData(timeframe);

    return NextResponse.json({
      hasReport: false,
      snapshot,
    });
  } catch (error: any) {
    console.error('Failed to get latest AI analysis:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch latest analysis' }, { status: 500 });
  }
}
