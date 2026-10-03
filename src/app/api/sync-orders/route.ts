import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { syncShopifyOrders } from '@/lib/shopify-sync';

async function handleSync(req: NextRequest) {
  // 1. Check for Cron Secret or Vercel Cron header
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const url = new URL(req.url);
  const querySecret = url.searchParams.get('cron_secret');
  const isVercelCron = req.headers.get('x-vercel-cron') !== null;

  const isCronAuthorized =
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (cronSecret && querySecret === cronSecret) ||
    (isVercelCron && (!cronSecret || authHeader === `Bearer ${cronSecret}`));

  if (!isCronAuthorized) {
    // 2. Fall back to requiring a logged-in dashboard user
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
  }

  try {
    const result = await syncShopifyOrders();
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Error syncing orders:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleSync(req);
}

export async function POST(req: NextRequest) {
  return handleSync(req);
}
