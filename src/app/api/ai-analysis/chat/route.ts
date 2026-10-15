import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { hasPermission } from '@/lib/rbac';
import { aggregateFinancialData, TimeframeOption } from '@/lib/ai/financial-aggregator';
import { getGeminiClient } from '@/lib/ai/gemini-client';
import { buildAdvisorChatPrompt } from '@/lib/ai/prompts';

export async function POST(req: NextRequest) {
  try {
    const authRes = await requireAuth();
    if (authRes.error || !authRes.user) {
      return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: authRes.status || 401 });
    }

    if (!hasPermission(authRes.role, 'ai_analysis:generate', authRes.permissions)) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to consult the AI business advisor' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const question = (body.question as string || '').trim();
    const timeframe: TimeframeOption = (body.timeframe as TimeframeOption) || '30d';
    const summary = (body.summary as string) || '';
    const history = (body.history as Array<{ role: 'user' | 'model'; content: string }>) || [];

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // 1. Get snapshot
    const snapshot = await aggregateFinancialData(timeframe);

    // 2. Initialize Gemini
    const ai = await getGeminiClient();

    // 3. Build prompt
    const prompt = buildAdvisorChatPrompt(snapshot, summary, question, history);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const answer = response.text || 'Unable to generate response at this time.';

    return NextResponse.json({
      success: true,
      answer,
    });
  } catch (error: any) {
    console.error('Advisor chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get answer from AI advisor' },
      { status: 500 }
    );
  }
}
