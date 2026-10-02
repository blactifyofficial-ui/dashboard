import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { syncAllToGoogleSheets } from '@/lib/google-sheets';

export async function POST() {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const stats = await syncAllToGoogleSheets();
    return NextResponse.json(stats);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Internal server error during full sync';
    console.error('Error triggering full Google Sheets sync:', error);
    return NextResponse.json({ 
      success: false, 
      error: errorMsg 
    }, { status: 500 });
  }
}
