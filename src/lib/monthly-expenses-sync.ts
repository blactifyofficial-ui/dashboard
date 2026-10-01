import { db } from '@/db';
import { 
  expenses, 
  expenseActivities, 
  expenseCategories, 
  paymentMethods, 
  users 
} from '@/db/schema';
import { eq, or, ilike } from 'drizzle-orm';
import { parseMonthKey, getMonthLabel } from './monthly-expenses-utils';

/**
 * Friendly display names for monthly expense standard categories
 */
const CATEGORY_NAMES_MAP: Record<string, string> = {
  RENT: 'Rent & Lease',
  UTILITIES: 'Utilities & Bills',
  SALARY: 'Salaries & Wages',
  SOFTWARE: 'Software & Subscriptions',
  MAINTENANCE: 'Repairs & Maintenance',
  OPERATIONAL: 'Operational Expenses',
  MARKETING: 'Marketing & Ads',
};

/**
 * Finds an existing expense category or creates one for the monthly bill category
 */
export async function getOrCreateExpenseCategoryForMonthlyBill(categoryRaw: string): Promise<string> {
  const normalizedCode = (categoryRaw || 'OPERATIONAL').trim().toUpperCase().replace(/\s+/g, '_');
  const friendlyName = CATEGORY_NAMES_MAP[normalizedCode] || categoryRaw.trim();

  // Try to find matching category by code or name
  const existing = await db
    .select()
    .from(expenseCategories)
    .where(
      or(
        eq(expenseCategories.code, normalizedCode),
        ilike(expenseCategories.name, friendlyName),
        ilike(expenseCategories.name, categoryRaw.trim())
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  // Create new category
  const newId = crypto.randomUUID();
  await db.insert(expenseCategories).values({
    id: newId,
    code: normalizedCode,
    name: friendlyName,
    description: `Expenses related to ${friendlyName} and monthly bills.`,
    isActive: 'true',
  });

  return newId;
}

/**
 * Resolves a valid payment method ID or retrieves a fallback default
 */
export async function resolvePaymentMethodId(preferredId?: string | null): Promise<string> {
  if (preferredId) {
    const [existing] = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.id, preferredId))
      .limit(1);
    if (existing) return existing.id;
  }

  // Find any active payment method
  const activeMethods = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.isActive, 'true'))
    .limit(1);

  if (activeMethods.length > 0) {
    return activeMethods[0].id;
  }

  // Create a default Bank Transfer payment method if none exists
  const newPmId = crypto.randomUUID();
  await db.insert(paymentMethods).values({
    id: newPmId,
    code: 'BANK_TRANSFER',
    name: 'Bank Transfer',
    isActive: 'true',
  });

  return newPmId;
}

export interface SyncMonthlyBillParams {
  existingExpenseId?: string | null;
  month: string; // 'YYYY-MM'
  name: string;
  category: string;
  actualAmount: string | number;
  expectedAmount?: string | number;
  dueDay?: string | number | null;
  paidDate?: string | Date | null;
  paymentMethodId?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
  userId: string;
  userName?: string;
  userEmail?: string;
}

/**
 * Creates or updates an Expense record in the expenses table when a monthly bill is marked as PAID.
 */
export async function syncMonthlyBillPaymentToExpenses(params: SyncMonthlyBillParams): Promise<string> {
  const {
    existingExpenseId,
    month,
    name,
    category,
    actualAmount,
    expectedAmount,
    dueDay,
    paidDate,
    paymentMethodId,
    referenceNumber,
    notes,
    userId,
    userName,
    userEmail,
  } = params;

  // Ensure user exists in "user" table
  if (userId) {
    await db.insert(users).values({
      id: userId,
      name: userName || '',
      email: userEmail || '',
    }).onConflictDoUpdate({
      target: users.id,
      set: {
        name: userName || '',
        email: userEmail || '',
      }
    });
  }

  const categoryId = await getOrCreateExpenseCategoryForMonthlyBill(category);
  const resolvedPaymentMethodId = await resolvePaymentMethodId(paymentMethodId);

  const amountNum = parseFloat(String(actualAmount || expectedAmount || '0')) || 0;
  const formattedAmount = amountNum.toFixed(2);

  // Build title with Month Label (e.g., "Shop / Office Rent (March 2026)")
  let monthLabel = month;
  try {
    const { year, monthNum } = parseMonthKey(month);
    monthLabel = getMonthLabel(year, monthNum);
  } catch {
    monthLabel = month;
  }

  const expenseTitle = `${name.trim()} (${monthLabel})`;

  const descriptionParts = [
    `Monthly Bill: ${name.trim()}`,
    `Period: ${monthLabel}`,
    category ? `Category: ${category}` : null,
    dueDay ? `Due Day: ${dueDay}` : null,
    referenceNumber ? `Ref: ${referenceNumber.trim()}` : null,
    notes ? `Notes: ${notes.trim()}` : null,
  ].filter(Boolean);

  const expenseDescription = descriptionParts.join(' | ');
  const expenseDateObj = paidDate ? new Date(paidDate) : new Date();

  // If already linked to an existing expense, update it
  if (existingExpenseId) {
    const [existingExpense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, existingExpenseId))
      .limit(1);

    if (existingExpense) {
      await db
        .update(expenses)
        .set({
          categoryId,
          paymentMethodId: resolvedPaymentMethodId,
          title: expenseTitle,
          description: expenseDescription,
          amount: formattedAmount,
          expenseDate: expenseDateObj,
          referenceNumber: referenceNumber?.trim() || null,
          deletedAt: null,
          deletedById: null,
          updatedAt: new Date(),
          updatedById: userId,
        })
        .where(eq(expenses.id, existingExpenseId));

      await db.insert(expenseActivities).values({
        id: crypto.randomUUID(),
        expenseId: existingExpenseId,
        actorId: userId,
        activityType: 'UPDATED',
        oldValue: existingExpense.amount,
        newValue: formattedAmount,
        remark: `Updated from monthly bill payment (${monthLabel})`,
      });

      return existingExpenseId;
    }
  }

  // Create brand new Expense record
  const newExpenseId = crypto.randomUUID();
  await db.insert(expenses).values({
    id: newExpenseId,
    categoryId,
    paymentMethodId: resolvedPaymentMethodId,
    title: expenseTitle,
    description: expenseDescription,
    amount: formattedAmount,
    expenseDate: expenseDateObj,
    referenceNumber: referenceNumber?.trim() || null,
    createdById: userId,
  });

  await db.insert(expenseActivities).values({
    id: crypto.randomUUID(),
    expenseId: newExpenseId,
    actorId: userId,
    activityType: 'CREATED',
    newValue: formattedAmount,
    remark: `Recorded from monthly bill payment (${name} - ${monthLabel})`,
  });

  return newExpenseId;
}

/**
 * Soft-deletes a linked expense when a monthly bill is marked as unpaid or deleted
 */
export async function removeMonthlyBillPaymentFromExpenses(
  expenseId: string,
  userId: string,
  remark?: string
): Promise<void> {
  if (!expenseId) return;

  const [existing] = await db
    .select()
    .from(expenses)
    .where(eq(expenses.id, expenseId))
    .limit(1);

  if (!existing) return;

  await db
    .update(expenses)
    .set({
      deletedAt: new Date(),
      deletedById: userId,
      updatedAt: new Date(),
      updatedById: userId,
    })
    .where(eq(expenses.id, expenseId));

  await db.insert(expenseActivities).values({
    id: crypto.randomUUID(),
    expenseId,
    actorId: userId,
    activityType: 'DELETED',
    remark: remark || 'Auto-deleted because monthly bill was marked as unpaid or deleted',
  });
}
