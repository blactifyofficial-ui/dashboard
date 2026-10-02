import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { testGoogleSheetsConnection } from '@/lib/google-sheets';

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const status = await testGoogleSheetsConnection();
    return NextResponse.json(status);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error fetching Google Sheets status:', error);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
