import { NextRequest, NextResponse } from 'next/server';
import { syncShopifyOrders } from '@/lib/shopify-sync';
import { syncAllToGoogleSheets } from '@/lib/google-sheets';

/**
 * Unified daily cron endpoint for Vercel Hobby plan (1 cron limit, 1/day).
 * Runs Shopify order sync first, then synchronizes all fresh data to Google Sheets.
 */
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
    // 1. Sync orders from Shopify
    const orderSyncResult = await syncShopifyOrders();

    // 2. Sync all database entities to Google Sheets
    const sheetsSyncResult = await syncAllToGoogleSheets();

    return NextResponse.json({
      message: 'Daily unified cron completed successfully',
      orders: orderSyncResult,
      googleSheets: sheetsSyncResult,
      timestamp: new Date().toISOString(),
    }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Daily unified cron execution failed';
    console.error('Error executing daily unified cron:', error);
    return NextResponse.json({
      error: errorMessage,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
