import { NextResponse } from 'next/server';
import { db } from '@/db';
import { partners, partnerTransactions, paymentMethods, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // 1. Fetch all partners
    const allPartners = await db
      .select({
        id: partners.id,
        name: partners.name,
        email: partners.email,
        phone: partners.phone,
        equityPercentage: partners.equityPercentage,
        status: partners.status,
        joinedDate: partners.joinedDate,
        notes: partners.notes,
        createdAt: partners.createdAt,
        updatedAt: partners.updatedAt,
      })
      .from(partners)
      .orderBy(desc(partners.createdAt));

    // 2. Fetch all transactions
    const allTransactions = await db
      .select({
        id: partnerTransactions.id,
        partnerId: partnerTransactions.partnerId,
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
      })
      .from(partnerTransactions)
      .leftJoin(paymentMethods, eq(partnerTransactions.paymentMethodId, paymentMethods.id))
      .leftJoin(users, eq(partnerTransactions.createdById, users.id))
      .orderBy(desc(partnerTransactions.transactionDate), desc(partnerTransactions.createdAt));

    // 3. Fetch active payment methods
    const activePaymentMethods = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.isActive, 'true'));

    // 4. Compute partner aggregates
    let totalInvestedAll = 0;
    let totalWithdrawnAll = 0;
    let totalProfitShareAll = 0;

    const partnersWithStats = allPartners.map((partner) => {
      const pTxns = allTransactions.filter((t) => t.partnerId === partner.id && t.status === 'COMPLETED');
      
      const totalInvested = pTxns
        .filter((t) => t.type === 'INVESTMENT')
        .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);

      const totalWithdrawn = pTxns
        .filter((t) => t.type === 'WITHDRAWAL' || t.type === 'PAYOUT')
        .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);

      const totalProfitShare = pTxns
        .filter((t) => t.type === 'PROFIT_SHARE')
        .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);

      const netCapital = totalInvested - totalWithdrawn;

      totalInvestedAll += totalInvested;
      totalWithdrawnAll += totalWithdrawn;
      totalProfitShareAll += totalProfitShare;

      return {
        ...partner,
        totalInvested,
        totalWithdrawn,
        totalProfitShare,
        netCapital,
        transactionCount: pTxns.length,
        transactions: pTxns.slice(0, 5), // recent 5
      };
    });

    const netActiveCapitalPool = totalInvestedAll - totalWithdrawnAll;
    const totalAllocatedEquity = allPartners.reduce(
      (sum, p) => sum + parseFloat(p.equityPercentage || '0'),
      0
    );

    return NextResponse.json({
      partners: partnersWithStats,
      transactions: allTransactions,
      paymentMethods: activePaymentMethods,
      summary: {
        totalInvested: totalInvestedAll,
        totalWithdrawn: totalWithdrawnAll,
        totalProfitShare: totalProfitShareAll,
        netActiveCapitalPool,
        totalAllocatedEquity,
        partnerCount: allPartners.length,
        activePartnerCount: allPartners.filter((p) => p.status === 'ACTIVE').length,
        transactionCount: allTransactions.length,
      },
    });
  } catch (error) {
    console.error('Error fetching partners data:', error);
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
    const { name, email, phone, equityPercentage, status = 'ACTIVE', joinedDate, notes } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Partner name is required' }, { status: 400 });
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

    const partnerId = crypto.randomUUID();
    const [newPartner] = await db
      .insert(partners)
      .values({
        id: partnerId,
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        equityPercentage: equityPercentage ? String(equityPercentage) : '0',
        status: status || 'ACTIVE',
        joinedDate: joinedDate ? new Date(joinedDate) : new Date(),
        notes: notes?.trim() || null,
        createdById: session.user.id,
      })
      .returning();

    return NextResponse.json({ success: true, partner: newPartner }, { status: 201 });
  } catch (error) {
    console.error('Error creating partner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
