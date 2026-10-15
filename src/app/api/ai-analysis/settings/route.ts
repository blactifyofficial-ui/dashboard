import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { hasPermission } from '@/lib/rbac';
import { getGeminiApiKey, saveGeminiApiKey } from '@/lib/ai/gemini-client';

export async function GET() {
  try {
    const authRes = await requireAuth();
    if (authRes.error || !authRes.user) {
      return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: authRes.status || 401 });
    }

    const key = await getGeminiApiKey();
    const isEnv = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');

    return NextResponse.json({
      configured: Boolean(key),
      isEnv,
      maskedKey: key ? `••••••••••••${key.slice(-4)}` : null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to check Gemini settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authRes = await requireAuth();
    if (authRes.error || !authRes.user) {
      return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: authRes.status || 401 });
    }

    // Only SUPER_ADMIN can save API keys
    if (authRes.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Super Admins can update system API keys' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const apiKey = (body.apiKey as string || '').trim();

    if (!apiKey) {
      return NextResponse.json({ error: 'API key cannot be empty' }, { status: 400 });
    }

    const saved = await saveGeminiApiKey(apiKey);
    if (!saved) {
      return NextResponse.json({ error: 'Failed to save API key in database' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Gemini API key saved successfully',
      maskedKey: `••••••••••••${apiKey.slice(-4)}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update Gemini settings' }, { status: 500 });
  }
}
