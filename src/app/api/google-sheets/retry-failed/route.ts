import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { retryFailedSyncJobs } from '@/lib/google-sheets';

export async function POST() {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const result = await retryFailedSyncJobs();
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Internal server error while retrying failed syncs';
    console.error('Error retrying failed Google Sheets syncs:', error);
    return NextResponse.json({ 
      success: false, 
      error: errorMsg 
    }, { status: 500 });
  }
}
