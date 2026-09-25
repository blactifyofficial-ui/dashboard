import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { ilike, or } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';

export async function GET(req: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const session = { user: authResult.user! };

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q || q.length < 2) {
      return NextResponse.json([]);
    }

    const results = await db.select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerName: orders.customerName,
      customerEmail: orders.customerEmail,
    })
      .from(orders)
      .where(
        or(
          ilike(orders.id, `%${q}%`),
          ilike(orders.orderNumber, `%${q}%`),
          ilike(orders.customerName, `%${q}%`),
          ilike(orders.customerEmail, `%${q}%`)
        )
      )
      .limit(10);

    return NextResponse.json(results);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
