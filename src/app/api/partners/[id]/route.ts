import { NextResponse } from 'next/server';
import { db } from '@/db';
import { partners, partnerTransactions, paymentMethods, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth-utils';
import { enqueueSyncJob } from '@/lib/google-sheets';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requirePermission('partners:view_self');
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;

    if (authResult.role === 'PARTNER' && authResult.partnerId && authResult.partnerId !== id) {
      return NextResponse.json({ error: 'Forbidden: You can only view your own partner profile' }, { status: 403 });
    }

    const [partner] = await db.select().from(partners).where(eq(partners.id, id)).limit(1);
    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const transactions = await db
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
      })
      .from(partnerTransactions)
      .leftJoin(partners, eq(partnerTransactions.partnerId, partners.id))
      .leftJoin(paymentMethods, eq(partnerTransactions.paymentMethodId, paymentMethods.id))
      .leftJoin(users, eq(partnerTransactions.createdById, users.id))
      .where(eq(partnerTransactions.partnerId, id))
      .orderBy(desc(partnerTransactions.transactionDate), desc(partnerTransactions.createdAt));

    const totalInvested = transactions
      .filter((t) => t.type === 'INVESTMENT' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);

    const totalWithdrawn = transactions
      .filter((t) => (t.type === 'WITHDRAWAL' || t.type === 'PAYOUT') && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);

    const totalProfitShare = transactions
      .filter((t) => t.type === 'PROFIT_SHARE' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);

    const netCapital = totalInvested - totalWithdrawn;

    return NextResponse.json({
      partner: {
        ...partner,
        totalInvested,
        totalWithdrawn,
        totalProfitShare,
        netCapital,
        transactionCount: transactions.length,
      },
      transactions,
    });
  } catch (error) {
    console.error('Error fetching partner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requirePermission('partners:manage_partners');
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, email, phone, equityPercentage, status, joinedDate, notes } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Partner name is required' }, { status: 400 });
    }

    const [updated] = await db
      .update(partners)
      .set({
        name: name.trim(),
        email: email !== undefined ? (email?.trim() || null) : undefined,
        phone: phone !== undefined ? (phone?.trim() || null) : undefined,
        equityPercentage: equityPercentage !== undefined ? String(equityPercentage) : undefined,
        status: status !== undefined ? status : undefined,
        joinedDate: joinedDate ? new Date(joinedDate) : undefined,
        notes: notes !== undefined ? (notes?.trim() || null) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(partners.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Automatically sync partner update to Google Sheets
    void enqueueSyncJob({
      entity: 'partners',
      databaseId: id,
      operation: 'UPDATE',
    });

    return NextResponse.json({ success: true, partner: updated });
  } catch (error) {
    console.error('Error updating partner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const PATCH = PUT;

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requirePermission('partners:manage_partners');
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;

    // Delete associated transactions first
    await db.delete(partnerTransactions).where(eq(partnerTransactions.partnerId, id));

    // Delete partner
    const [deleted] = await db.delete(partners).where(eq(partners.id, id)).returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Automatically sync partner deletion to Google Sheets
    void enqueueSyncJob({
      entity: 'partners',
      databaseId: id,
      operation: 'DELETE',
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Error deleting partner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

