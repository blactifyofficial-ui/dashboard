import { NextRequest, NextResponse } from 'next/server';
import { checkAndGenerateMonthlyReportOnSchedule } from '@/lib/financial-report-service';

/**
 * Dedicated cron endpoint for Monthly Financial Report compilation and email delivery.
 * Scheduled to run on the 1st of every month (or whenever manually triggered).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const url = new URL(req.url);
  const querySecret = url.searchParams.get('cron_secret');
  const monthParam = url.searchParams.get('month') || undefined;
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
    const result = await checkAndGenerateMonthlyReportOnSchedule(monthParam);
    return NextResponse.json(
      {
        message: 'Monthly financial report schedule completed',
        ...result,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Monthly report generation failed';
    console.error('Error executing monthly financial report cron:', error);
    return NextResponse.json(
      {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}

