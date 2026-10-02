import { NextResponse } from 'next/server';
import { db } from '@/db';
import { expenses, expenseActivities, expenseCategories, paymentMethods, users } from '@/db/schema';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';
import { enqueueSyncJob } from '@/lib/google-sheets';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;
    const [expense] = await db
      .select({
        id: expenses.id,
        title: expenses.title,
        description: expenses.description,
        amount: expenses.amount,
        expenseDate: expenses.expenseDate,
        referenceNumber: expenses.referenceNumber,
        categoryId: expenses.categoryId,
        paymentMethodId: expenses.paymentMethodId,
        category: expenseCategories.name,
        paymentMethod: paymentMethods.name,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
      })
      .from(expenses)
      .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .leftJoin(paymentMethods, eq(expenses.paymentMethodId, paymentMethods.id))
      .where(and(eq(expenses.id, id), isNull(expenses.deletedAt)));

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const activities = await db
      .select({
        id: expenseActivities.id,
        activityType: expenseActivities.activityType,
        oldValue: expenseActivities.oldValue,
        newValue: expenseActivities.newValue,
        remark: expenseActivities.remark,
        createdAt: expenseActivities.createdAt,
        actorName: users.name,
      })
      .from(expenseActivities)
      .leftJoin(users, eq(expenseActivities.actorId, users.id))
      .where(eq(expenseActivities.expenseId, id))
      .orderBy(desc(expenseActivities.createdAt));

    return NextResponse.json({ ...expense, activities });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const session = { user: authResult.user! };

    const { id } = await params;
    const body = await req.json();
    const { categoryId, paymentMethodId, title, description, amount, expenseDate, referenceNumber, remark } = body;

    // Verify expense exists
    const [existing] = await db.select().from(expenses).where(and(eq(expenses.id, id), isNull(expenses.deletedAt)));
    if (!existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    if (!categoryId || !paymentMethodId || !title?.trim() || !amount || !expenseDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
    }

    // Upsert user
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

    const [updated] = await db.update(expenses).set({
      categoryId,
      paymentMethodId,
      title: title.trim(),
      description: description?.trim() || null,
      amount: amount.toString(),
      expenseDate: new Date(expenseDate),
      referenceNumber: referenceNumber?.trim() || null,
      updatedById: session.user.id,
      updatedAt: new Date(),
    }).where(eq(expenses.id, id)).returning();

    // Log the edit activity
    await db.insert(expenseActivities).values({
      id: crypto.randomUUID(),
      expenseId: id,
      actorId: session.user.id,
      activityType: 'UPDATED',
      oldValue: existing.amount?.toString() || '',
      newValue: amount.toString(),
      remark: remark?.trim() || 'Expense updated',
    });

    // Automatically sync updated expense to Google Sheets
    void enqueueSyncJob({
      entity: 'expenses',
      databaseId: id,
      operation: 'UPDATE',
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const session = { user: authResult.user! };

    const { id } = await params;

    const [existing] = await db.select().from(expenses).where(and(eq(expenses.id, id), isNull(expenses.deletedAt)));
    if (!existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Upsert user
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

    // Soft delete
    await db.update(expenses).set({
      deletedAt: new Date(),
      deletedById: session.user.id,
      updatedAt: new Date(),
    }).where(eq(expenses.id, id));

    await db.insert(expenseActivities).values({
      id: crypto.randomUUID(),
      expenseId: id,
      actorId: session.user.id,
      activityType: 'DELETED',
      remark: 'Expense deleted',
    });

    // Automatically sync deletion to Google Sheets (marks status = DELETED)
    void enqueueSyncJob({
      entity: 'expenses',
      databaseId: id,
      operation: 'DELETE',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

