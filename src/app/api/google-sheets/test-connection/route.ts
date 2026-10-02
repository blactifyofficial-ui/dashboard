import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { testGoogleSheetsConnection } from '@/lib/google-sheets';

export async function POST() {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const result = await testGoogleSheetsConnection();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Internal server error while testing connection';
    console.error('Error testing Google Sheets connection:', error);
    return NextResponse.json({ 
      connected: false,
      error: errorMsg 
    }, { status: 500 });
  }
}
