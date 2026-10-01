import { NextResponse } from 'next/server';
import { db } from '@/db';
import { partnerTransactions, partners, paymentMethods, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';

export async function GET(req: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const partnerId = searchParams.get('partnerId');
    const type = searchParams.get('type');

    const query = db
      .select({
        id: partnerTransactions.id,
        partnerId: partnerTransactions.partnerId,
        partnerName: partners.name,
        partnerEmail: partners.email,
        type: partnerTransactions.type,
        amount: partnerTransactions.amount,
        transactionDate: partnerTransactions.transactionDate,
        paymentMethodId: partnerTransactions.paymentMethodId,
        paymentMethodName: paymentMethods.name,
        status: partnerTransactions.status,
        referenceNumber: partnerTransactions.referenceNumber,
        notes: partnerTransactions.notes,
        createdById: partnerTransactions.createdById,
        creatorName: users.name,
        createdAt: partnerTransactions.createdAt,
        updatedAt: partnerTransactions.updatedAt,
      })
      .from(partnerTransactions)
      .innerJoin(partners, eq(partnerTransactions.partnerId, partners.id))
      .leftJoin(paymentMethods, eq(partnerTransactions.paymentMethodId, paymentMethods.id))
      .leftJoin(users, eq(partnerTransactions.createdById, users.id))
      .orderBy(desc(partnerTransactions.transactionDate), desc(partnerTransactions.createdAt));

    const transactions = await query;

    let filtered = transactions;
    if (partnerId) {
      filtered = filtered.filter((t) => t.partnerId === partnerId);
    }
    if (type && type !== 'ALL') {
      filtered = filtered.filter((t) => t.type === type);
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Error fetching partner transactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const session = { user: authResult.user! };

    const body = await req.json();
    const {
      partnerId,
      type, // 'INVESTMENT', 'WITHDRAWAL', 'PROFIT_SHARE', 'PAYOUT'
      amount,
      transactionDate,
      paymentMethodId,
      status = 'COMPLETED',
      referenceNumber,
      notes,
    } = body;

    if (!partnerId || !type || !amount || !transactionDate) {
      return NextResponse.json({ error: 'Missing required transaction fields' }, { status: 400 });
    }

    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
    }

    // Verify partner exists
    const [partner] = await db.select().from(partners).where(eq(partners.id, partnerId)).limit(1);
    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Ensure session user exists in "user" table
    await db.insert(users).values({
      id: session.user.id,
      name: session.user.name || '',
      email: session.user.email || '',
    }).onConflictDoUpdate({
      target: users.id,
      set: {
        name: session.user.name || '',
        email: session.user.email || '',
      }
    });

    const txnId = crypto.randomUUID();
    const [newTxn] = await db
      .insert(partnerTransactions)
      .values({
        id: txnId,
        partnerId,
        type,
        amount: String(amount),
        transactionDate: new Date(transactionDate),
        paymentMethodId: paymentMethodId || null,
        status: status || 'COMPLETED',
        referenceNumber: referenceNumber?.trim() || null,
        notes: notes?.trim() || null,
        createdById: session.user.id,
      })
      .returning();

    return NextResponse.json({ success: true, transaction: newTxn }, { status: 201 });
  } catch (error) {
    console.error('Error creating partner transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
