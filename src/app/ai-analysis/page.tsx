import { db } from '@/db';
import { aiAnalysisReports } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth-utils';
import { hasPermission } from '@/lib/rbac';
import AccessDenied from '@/components/AccessDenied';
import { aggregateFinancialData } from '@/lib/ai/financial-aggregator';
import { AiStrategicReport } from '@/lib/ai/prompts';
import AiAnalysisDashboard from '@/components/ai-analysis/AiAnalysisDashboard';

export const dynamic = "force-dynamic";

export default async function AiAnalysisPage() {
  const authRes = await requirePermission('ai_analysis:view');
  if ('error' in authRes) {
    return <AccessDenied message="You do not have permission to view AI financial & strategic intelligence." />;
  }

  const canGenerate = hasPermission(authRes.role, 'ai_analysis:generate', authRes.permissions);

  // Check for the most recent cached report (default 30d, ALL)
  const [latestReport] = await db
    .select()
    .from(aiAnalysisReports)
    .where(
      and(
        eq(aiAnalysisReports.timeframe, '30d'),
        eq(aiAnalysisReports.focusArea, 'ALL')
      )
    )
    .orderBy(desc(aiAnalysisReports.createdAt))
    .limit(1);

  let initialReport: AiStrategicReport | null = null;
  let initialSnapshot = null;
  let initialCreatedAt: string | null = null;
  let initialCached = false;

  if (latestReport) {
    try {
      initialReport = JSON.parse(latestReport.reportJson) as AiStrategicReport;
      initialSnapshot = JSON.parse(latestReport.metricsSnapshot);
      initialCreatedAt = latestReport.createdAt ? latestReport.createdAt.toISOString() : null;
      initialCached = true;
    } catch (e) {
      console.error('Failed to parse cached report JSON:', e);
    }
  }

  // If no snapshot was loaded from cache, aggregate live numbers
  if (!initialSnapshot) {
    initialSnapshot = await aggregateFinancialData('30d');
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-2 sm:px-4 text-foreground">
      <AiAnalysisDashboard
        initialReport={initialReport}
        initialSnapshot={initialSnapshot}
        initialCreatedAt={initialCreatedAt}
        initialCached={initialCached}
        canGenerate={canGenerate}
      />
    </div>
  );
}
