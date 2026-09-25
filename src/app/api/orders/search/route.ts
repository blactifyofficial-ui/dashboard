import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { ilike, or } from 'drizzle-orm';
import { auth } from '@/lib/auth/server';

export async function GET(req: Request) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
