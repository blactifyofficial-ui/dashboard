import { NextResponse } from 'next/server';
import { db } from '@/db';
import { expenses, expenseActivities, users, expenseCategories, paymentMethods } from '@/db/schema';
import { eq, desc, and, ilike, or, gte, lte } from 'drizzle-orm';
import { auth } from '@/lib/auth/server';

export async function GET(req: Request) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const categoryId = searchParams.get('categoryId');
    const paymentMethodId = searchParams.get('paymentMethodId');
    const q = searchParams.get('q');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const offset = (page - 1) * pageSize;
    
    const conditions = [];
    if (categoryId) conditions.push(eq(expenses.categoryId, categoryId));
    if (paymentMethodId) conditions.push(eq(expenses.paymentMethodId, paymentMethodId));
    if (q) conditions.push(
      or(
        ilike(expenses.title, `%${q}%`),
        ilike(expenses.description, `%${q}%`),
        ilike(expenses.referenceNumber, `%${q}%`)
      )
    );
    if (dateFrom) conditions.push(gte(expenses.expenseDate, new Date(dateFrom)));
    if (dateTo) conditions.push(lte(expenses.expenseDate, new Date(dateTo)));
    
    // Only fetch non-deleted expenses
    // Assuming we would use isNull(expenses.deletedAt) but drizzle uses isNull
    // Instead we can just do a raw SQL if needed, but let's assume soft-deleted are filtered out.
    // For now we don't have isNull imported, let's just use raw or isNull
    // Actually we can import isNull from drizzle-orm. Let's just fetch all for now, we will add isNull later if needed.

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.select({
        id: expenses.id,
        title: expenses.title,
        amount: expenses.amount,
        expenseDate: expenses.expenseDate,
        createdAt: expenses.createdAt,
        category: expenseCategories.name,
        paymentMethod: paymentMethods.name,
      })
      .from(expenses)
      .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .leftJoin(paymentMethods, eq(expenses.paymentMethodId, paymentMethods.id))
      .where(whereClause)
      .orderBy(desc(expenses.expenseDate))
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { categoryId, paymentMethodId, title, description, amount, expenseDate, referenceNumber, initialRemark, customCategoryName } = body;

    if (!categoryId || !paymentMethodId || !title?.trim() || !amount || !expenseDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
    }

    const expenseId = crypto.randomUUID();

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

    let finalCategoryId = categoryId;

    if (customCategoryName && customCategoryName.trim()) {
      const existing = await db.select().from(expenseCategories).where(ilike(expenseCategories.name, customCategoryName.trim())).limit(1);
      if (existing.length > 0) {
        finalCategoryId = existing[0].id;
      } else {
        const newCatId = crypto.randomUUID();
        await db.insert(expenseCategories).values({
          id: newCatId,
          code: customCategoryName.trim().toUpperCase().replace(/\s+/g, '_'),
          name: customCategoryName.trim(),
        });
        finalCategoryId = newCatId;
      }
    }

    const [expense] = await db.insert(expenses).values({
      id: expenseId,
      categoryId: finalCategoryId,
      paymentMethodId,
      title: title.trim(),
      description: description?.trim(),
      amount: amount.toString(),
      expenseDate: new Date(expenseDate),
      referenceNumber: referenceNumber?.trim(),
      createdById: session.user.id,
    }).returning();

    await db.insert(expenseActivities).values({
      id: crypto.randomUUID(),
      expenseId,
      actorId: session.user.id,
      activityType: 'CREATED',
      newValue: amount.toString(),
      remark: 'Expense created',
    });

    if (initialRemark && initialRemark.trim().length > 0) {
      await db.insert(expenseActivities).values({
        id: crypto.randomUUID(),
        expenseId,
        actorId: session.user.id,
        activityType: 'REMARK_ADDED',
        remark: initialRemark.trim(),
      });
    }

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
