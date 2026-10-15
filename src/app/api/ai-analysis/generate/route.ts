import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { hasPermission } from '@/lib/rbac';
import { db } from '@/db';
import { aiAnalysisReports } from '@/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { aggregateFinancialData, TimeframeOption } from '@/lib/ai/financial-aggregator';
import { getGeminiClient } from '@/lib/ai/gemini-client';
import { AI_ANALYSIS_SCHEMA, buildStrategicAnalysisPrompt, AiStrategicReport } from '@/lib/ai/prompts';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const authRes = await requireAuth();
    if (authRes.error || !authRes.user) {
      return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: authRes.status || 401 });
    }

    if (!hasPermission(authRes.role, 'ai_analysis:generate', authRes.permissions)) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to generate AI strategic reports' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const timeframe: TimeframeOption = (body.timeframe as TimeframeOption) || '30d';
    const focusArea = (body.focusArea as string) || 'ALL';
    const forceRefresh = Boolean(body.forceRefresh);

    // Check for cached report in the last 12 hours if not forcing refresh
    if (!forceRefresh) {
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
      const [cached] = await db
        .select()
        .from(aiAnalysisReports)
        .where(
          and(
            eq(aiAnalysisReports.timeframe, timeframe),
            eq(aiAnalysisReports.focusArea, focusArea),
            gte(aiAnalysisReports.createdAt, twelveHoursAgo)
          )
        )
        .orderBy(desc(aiAnalysisReports.createdAt))
        .limit(1);

      if (cached) {
        return NextResponse.json({
          success: true,
          cached: true,
          report: JSON.parse(cached.reportJson) as AiStrategicReport,
          snapshot: JSON.parse(cached.metricsSnapshot),
          createdAt: cached.createdAt,
        });
      }
    }

    // 1. Aggregate ledger data
    const snapshot = await aggregateFinancialData(timeframe);

    // 2. Initialize Gemini client
    let ai;
    try {
      ai = await getGeminiClient();
    } catch (clientErr: any) {
      return NextResponse.json(
        {
          error: clientErr.message || 'Gemini API is not configured',
          code: 'GEMINI_KEY_MISSING',
        },
        { status: 400 }
      );
    }

    // 3. Build Prompt & call Gemini 2.5 Flash
    const prompt = buildStrategicAnalysisPrompt(snapshot, focusArea);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: AI_ANALYSIS_SCHEMA,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response received from Gemini API');
    }

    const parsedReport = JSON.parse(responseText) as AiStrategicReport;

    // 4. Save report to database
    const newReportId = crypto.randomUUID();
    await db.insert(aiAnalysisReports).values({
      id: newReportId,
      timeframe,
      focusArea,
      healthScore: parsedReport.healthScore ? String(parsedReport.healthScore) : null,
      healthStatus: parsedReport.healthStatus || 'STABLE',
      summary: parsedReport.summary,
      reportJson: JSON.stringify(parsedReport),
      metricsSnapshot: JSON.stringify(snapshot),
      createdById: authRes.user.id || null,
    });

    return NextResponse.json({
      success: true,
      cached: false,
      report: parsedReport,
      snapshot,
      createdAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('AI Analysis generation error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate AI strategic analysis',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
