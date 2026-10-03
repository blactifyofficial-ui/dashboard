import { NextRequest, NextResponse } from 'next/server';
import { syncShopifyOrders } from '@/lib/shopify-sync';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const url = new URL(req.url);
  const querySecret = url.searchParams.get('cron_secret');
  const isVercelCron = req.headers.get('x-vercel-cron') !== null;

  // If CRON_SECRET is set, verify authorization
  if (cronSecret) {
    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` ||
      querySecret === cronSecret ||
      (isVercelCron && authHeader === `Bearer ${cronSecret}`);

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Invalid Cron Secret' }, { status: 401 });
    }
  }

  try {
    const result = await syncShopifyOrders();
    return NextResponse.json({
      message: 'Cron sync completed successfully',
      ...result,
    }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Cron sync execution failed';
    console.error('Error executing cron order sync:', error);
    return NextResponse.json({
      error: errorMessage,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
