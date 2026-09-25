import { NextResponse } from 'next/server';
import { db } from '@/db';
import { paymentMethods } from '@/db/schema';
import { requireAuth } from '@/lib/auth-utils';

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }


    const data = await db.select().from(paymentMethods);
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
