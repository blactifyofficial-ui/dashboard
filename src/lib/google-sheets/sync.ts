import { db } from '@/db';
import {
  orders,
  orderItems,
  expenses,
  expenseAttachments,
  expenseCategories,
  paymentMethods,
  users,
  monthlyExpenseEntries,
  monthlyExpenseTemplates,
  metaAdsTransactions,
  partners,
  partnerTransactions,
  orderIssues,
  issueCategories,
} from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getGoogleSheetsClient } from './client';
import { SHEET_TABS, SHEET_HEADERS, RowMapper, getTabNameForEntity } from './row-mapper';
import {
  ensureSheetWithHeaders,
  getSheetRowIds,
  updateSheetRow,
  appendSheetRows,
  batchUpdateSheetRows,
  recordBackupLog,
} from './sheets';
import { SyncEntity, SyncOperation, SyncResult, FullSyncStats, FullSyncEntityStats } from './types';

/**
 * Synchronizes a single entity record from PostgreSQL to Google Sheets
 */
export async function syncRecordToGoogleSheets(
  entity: SyncEntity,
  databaseId: string,
  operation: SyncOperation = 'UPDATE'
): Promise<SyncResult> {
  const startTime = new Date();
  let sheetsClient;

  try {
    sheetsClient = await getGoogleSheetsClient();
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to get Google Sheets client';
    return {
      success: false,
      entity,
      databaseId,
      operation,
      error: `Google Sheets client error: ${errorMsg}`,
    };
  }

  const { sheets, spreadsheetId } = sheetsClient;
  const tabName = getTabNameForEntity(entity);
  const headers = SHEET_HEADERS[tabName];

  try {
    await ensureSheetWithHeaders(sheets, spreadsheetId, tabName, headers);

    // Fetch entity record from database
    let rowData: (string | number)[] | null = null;
    const isDelete = operation === 'DELETE';

    switch (entity) {
      case 'orders': {
        const [record] = await db.select().from(orders).where(eq(orders.id, databaseId)).limit(1);
        if (record) {
          rowData = RowMapper.order(record as Record<string, unknown>, isDelete);
        }
        break;
      }

      case 'order_items': {
        const [record] = await db.select().from(orderItems).where(eq(orderItems.id, databaseId)).limit(1);
        if (record) {
          rowData = RowMapper.orderItem(record as Record<string, unknown>, isDelete);
        }
        break;
      }

      case 'expenses': {
        const [record] = await db
          .select({
            id: expenses.id,
            expenseDate: expenses.expenseDate,
            title: expenses.title,
            description: expenses.description,
            amount: expenses.amount,
            referenceNumber: expenses.referenceNumber,
            categoryId: expenses.categoryId,
            paymentMethodId: expenses.paymentMethodId,
            categoryName: expenseCategories.name,
            paymentMethodName: paymentMethods.name,
            creatorName: users.name,
            createdAt: expenses.createdAt,
            updatedAt: expenses.updatedAt,
            deletedAt: expenses.deletedAt,
          })
          .from(expenses)
          .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
          .leftJoin(paymentMethods, eq(expenses.paymentMethodId, paymentMethods.id))
          .leftJoin(users, eq(expenses.createdById, users.id))
          .where(eq(expenses.id, databaseId))
          .limit(1);

        if (record) {
          rowData = RowMapper.expense(record as Record<string, unknown>, isDelete);
        }
        break;
      }

      case 'expense_attachments': {
        const [record] = await db
          .select({
            id: expenseAttachments.id,
            expenseId: expenseAttachments.expenseId,
            fileName: expenseAttachments.fileName,
            fileUrl: expenseAttachments.fileUrl,
            fileType: expenseAttachments.fileType,
            fileSize: expenseAttachments.fileSize,
            uploaderName: users.name,
            createdAt: expenseAttachments.createdAt,
          })
          .from(expenseAttachments)
          .leftJoin(users, eq(expenseAttachments.uploadedById, users.id))
          .where(eq(expenseAttachments.id, databaseId))
          .limit(1);

        if (record) {
          rowData = RowMapper.expenseAttachment(record as Record<string, unknown>, isDelete);
        }
        break;
      }

      case 'monthly_expenses': {
        const [record] = await db
          .select({
            id: monthlyExpenseEntries.id,
            month: monthlyExpenseEntries.month,
            templateId: monthlyExpenseEntries.templateId,
            templateName: monthlyExpenseTemplates.name,
            name: monthlyExpenseEntries.name,
            category: monthlyExpenseEntries.category,
            expectedAmount: monthlyExpenseEntries.expectedAmount,
            actualAmount: monthlyExpenseEntries.actualAmount,
            dueDay: monthlyExpenseEntries.dueDay,
            status: monthlyExpenseEntries.status,
            paidDate: monthlyExpenseEntries.paidDate,
            paymentMethodId: monthlyExpenseEntries.paymentMethodId,
            paymentMethodName: paymentMethods.name,
            referenceNumber: monthlyExpenseEntries.referenceNumber,
            notes: monthlyExpenseEntries.notes,
            expenseId: monthlyExpenseEntries.expenseId,
            paidByName: users.name,
            createdAt: monthlyExpenseEntries.createdAt,
            updatedAt: monthlyExpenseEntries.updatedAt,
          })
          .from(monthlyExpenseEntries)
          .leftJoin(monthlyExpenseTemplates, eq(monthlyExpenseEntries.templateId, monthlyExpenseTemplates.id))
          .leftJoin(paymentMethods, eq(monthlyExpenseEntries.paymentMethodId, paymentMethods.id))
          .leftJoin(users, eq(monthlyExpenseEntries.paidById, users.id))
          .where(eq(monthlyExpenseEntries.id, databaseId))
          .limit(1);

        if (record) {
          rowData = RowMapper.monthlyExpenseEntry(record as Record<string, unknown>, isDelete);
        }
        break;
      }

      case 'monthly_expense_templates': {
        const [record] = await db
          .select({
            id: monthlyExpenseTemplates.id,
            name: monthlyExpenseTemplates.name,
            defaultAmount: monthlyExpenseTemplates.defaultAmount,
            dueDay: monthlyExpenseTemplates.dueDay,
            category: monthlyExpenseTemplates.category,
            paymentMethodId: monthlyExpenseTemplates.paymentMethodId,
            paymentMethodName: paymentMethods.name,
            isActive: monthlyExpenseTemplates.isActive,
            displayOrder: monthlyExpenseTemplates.displayOrder,
            notes: monthlyExpenseTemplates.notes,
            createdAt: monthlyExpenseTemplates.createdAt,
            updatedAt: monthlyExpenseTemplates.updatedAt,
          })
          .from(monthlyExpenseTemplates)
          .leftJoin(paymentMethods, eq(monthlyExpenseTemplates.paymentMethodId, paymentMethods.id))
          .where(eq(monthlyExpenseTemplates.id, databaseId))
          .limit(1);

        if (record) {
          rowData = RowMapper.monthlyExpenseTemplate(record as Record<string, unknown>, isDelete);
        }
        break;
      }

      case 'meta_ads': {
        const [record] = await db
          .select({
            id: metaAdsTransactions.id,
            weekStartDate: metaAdsTransactions.weekStartDate,
            weekEndDate: metaAdsTransactions.weekEndDate,
            dailyBudget: metaAdsTransactions.dailyBudget,
            calculatedWeeklyBudget: metaAdsTransactions.calculatedWeeklyBudget,
            amountPaid: metaAdsTransactions.amountPaid,
            paymentDate: metaAdsTransactions.paymentDate,
            paymentMethodId: metaAdsTransactions.paymentMethodId,
            paymentMethodName: paymentMethods.name,
            status: metaAdsTransactions.status,
            referenceNumber: metaAdsTransactions.referenceNumber,
            notes: metaAdsTransactions.notes,
            expenseId: metaAdsTransactions.expenseId,
            creatorName: users.name,
            createdAt: metaAdsTransactions.createdAt,
            updatedAt: metaAdsTransactions.updatedAt,
          })
          .from(metaAdsTransactions)
          .leftJoin(paymentMethods, eq(metaAdsTransactions.paymentMethodId, paymentMethods.id))
          .leftJoin(users, eq(metaAdsTransactions.createdById, users.id))
          .where(eq(metaAdsTransactions.id, databaseId))
          .limit(1);

        if (record) {
          rowData = RowMapper.metaAdsTransaction(record as Record<string, unknown>, isDelete);
        }
        break;
      }

      case 'partners': {
        const [record] = await db.select().from(partners).where(eq(partners.id, databaseId)).limit(1);
        if (record) {
          rowData = RowMapper.partner(record as Record<string, unknown>, isDelete);
        }
        break;
      }

      case 'partner_transactions':
      case 'payouts': {
        const [record] = await db
          .select({
            id: partnerTransactions.id,
            partnerId: partnerTransactions.partnerId,
            partnerName: partners.name,
            type: partnerTransactions.type,
            amount: partnerTransactions.amount,
            transactionDate: partnerTransactions.transactionDate,
            paymentMethodId: partnerTransactions.paymentMethodId,
            paymentMethodName: paymentMethods.name,
            status: partnerTransactions.status,
            referenceNumber: partnerTransactions.referenceNumber,
            notes: partnerTransactions.notes,
            creatorName: users.name,
            createdAt: partnerTransactions.createdAt,
            updatedAt: partnerTransactions.updatedAt,
          })
          .from(partnerTransactions)
          .leftJoin(partners, eq(partnerTransactions.partnerId, partners.id))
          .leftJoin(paymentMethods, eq(partnerTransactions.paymentMethodId, paymentMethods.id))
          .leftJoin(users, eq(partnerTransactions.createdById, users.id))
          .where(eq(partnerTransactions.id, databaseId))
          .limit(1);

        if (record) {
          rowData = RowMapper.partnerTransaction(record as Record<string, unknown>, isDelete);
        }
        break;
      }

      case 'order_issues': {
        const [record] = await db
          .select({
            id: orderIssues.id,
            orderId: orderIssues.orderId,
            orderNumber: orders.orderNumber,
            customerName: orders.customerName,
            categoryName: issueCategories.name,
            title: orderIssues.title,
            description: orderIssues.description,
            status: orderIssues.status,
            priority: orderIssues.priority,
            assignedToName: users.name,
            creatorName: users.name,
            resolverName: users.name,
            createdAt: orderIssues.createdAt,
            updatedAt: orderIssues.updatedAt,
            resolvedAt: orderIssues.resolvedAt,
            closedAt: orderIssues.closedAt,
          })
          .from(orderIssues)
          .leftJoin(orders, eq(orderIssues.orderId, orders.id))
          .leftJoin(issueCategories, eq(orderIssues.categoryId, issueCategories.id))
          .leftJoin(users, eq(orderIssues.createdById, users.id))
          .where(eq(orderIssues.id, databaseId))
          .limit(1);

        if (record) {
          rowData = RowMapper.orderIssue(record as Record<string, unknown>, isDelete);
        }
        break;
      }
    }

    // Check if ID exists in Google Sheet
    const existingRows = await getSheetRowIds(sheets, spreadsheetId, tabName);
    const existingRowNumber = existingRows.get(databaseId);

    if (rowData) {
      if (existingRowNumber) {
        // Update existing row
        await updateSheetRow(sheets, spreadsheetId, tabName, existingRowNumber, rowData);
      } else {
        // Append new row
        await appendSheetRows(sheets, spreadsheetId, tabName, [rowData]);
      }
    } else if (isDelete && existingRowNumber) {
      // Mark as deleted in existing row
      const currentValuesRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${tabName}'!A${existingRowNumber}:Z${existingRowNumber}`,
      });
      const currentRow = currentValuesRes.data.values?.[0] || [];
      if (currentRow.length > 0) {
        currentRow[currentRow.length - 1] = 'DELETED';
        await updateSheetRow(sheets, spreadsheetId, tabName, existingRowNumber, currentRow as (string | number)[]);
      }
    }

    // If entity is partner_transactions and type is PAYOUT, also mirror into Payouts sheet
    if (entity === 'partner_transactions' && rowData) {
      try {
        const [txn] = await db
          .select({ type: partnerTransactions.type })
          .from(partnerTransactions)
          .where(eq(partnerTransactions.id, databaseId))
          .limit(1);

        if (txn && txn.type === 'PAYOUT') {
          const payoutsTab = SHEET_TABS.PAYOUTS;
          await ensureSheetWithHeaders(sheets, spreadsheetId, payoutsTab, SHEET_HEADERS[payoutsTab]);
          const payoutRowIds = await getSheetRowIds(sheets, spreadsheetId, payoutsTab);
          const payoutRowNum = payoutRowIds.get(databaseId);
          if (payoutRowNum) {
            await updateSheetRow(sheets, spreadsheetId, payoutsTab, payoutRowNum, rowData);
          } else {
            await appendSheetRows(sheets, spreadsheetId, payoutsTab, [rowData]);
          }
        }
      } catch (payoutErr) {
        console.warn('Error mirroring payout to Payouts tab:', payoutErr);
      }
    }

    // Record success in Backup Log
    await recordBackupLog(sheets, spreadsheetId, {
      timestamp: startTime,
      entity,
      databaseId,
      operation,
      status: 'SUCCESS',
      attempt: 1,
    });

    return {
      success: true,
      entity,
      databaseId,
      operation,
      rowsAffected: 1,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error syncing to Google Sheets';
    console.error(`Google Sheets sync error for entity ${entity} (${databaseId}):`, err);

    await recordBackupLog(sheets, spreadsheetId, {
      timestamp: startTime,
      entity,
      databaseId,
      operation,
      status: 'FAILED',
      attempt: 1,
      error: errorMsg,
    });

    return {
      success: false,
      entity,
      databaseId,
      operation,
      error: errorMsg,
    };
  }
}

/**
 * Performs full, idempotent synchronization from PostgreSQL to Google Sheets
 */
export async function syncAllToGoogleSheets(): Promise<FullSyncStats> {
  const startTime = new Date();
  const { sheets, spreadsheetId } = await getGoogleSheetsClient();

  const entityStats: FullSyncEntityStats[] = [];
  let totalRecords = 0;

  // 1. Orders
  try {
    const tabName = SHEET_TABS.ORDERS;
    const headers = SHEET_HEADERS[tabName];
    await ensureSheetWithHeaders(sheets, spreadsheetId, tabName, headers);

    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    const existingIds = await getSheetRowIds(sheets, spreadsheetId, tabName);

    const updates: { rowNumber: number; rowData: (string | number)[] }[] = [];
    const appends: (string | number)[][] = [];

    for (const order of allOrders) {
      const row = RowMapper.order(order as Record<string, unknown>, false);
      const existingRow = existingIds.get(order.id);
      if (existingRow) {
        updates.push({ rowNumber: existingRow, rowData: row });
      } else {
        appends.push(row);
      }
    }

    if (updates.length > 0) await batchUpdateSheetRows(sheets, spreadsheetId, tabName, updates);
    if (appends.length > 0) await appendSheetRows(sheets, spreadsheetId, tabName, appends);

    totalRecords += allOrders.length;
    entityStats.push({ entity: 'orders', tabName, count: allOrders.length, success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error syncing Orders';
    console.error('Error syncing Orders:', err);
    entityStats.push({ entity: 'orders', tabName: SHEET_TABS.ORDERS, count: 0, success: false, error: errorMsg });
  }

  // 2. Order Items
  try {
    const tabName = SHEET_TABS.ORDER_ITEMS;
    const headers = SHEET_HEADERS[tabName];
    await ensureSheetWithHeaders(sheets, spreadsheetId, tabName, headers);

    const allItems = await db.select().from(orderItems);
    const existingIds = await getSheetRowIds(sheets, spreadsheetId, tabName);

    const updates: { rowNumber: number; rowData: (string | number)[] }[] = [];
    const appends: (string | number)[][] = [];

    for (const item of allItems) {
      const row = RowMapper.orderItem(item as Record<string, unknown>, false);
      const existingRow = existingIds.get(item.id);
      if (existingRow) {
        updates.push({ rowNumber: existingRow, rowData: row });
      } else {
        appends.push(row);
      }
    }

    if (updates.length > 0) await batchUpdateSheetRows(sheets, spreadsheetId, tabName, updates);
    if (appends.length > 0) await appendSheetRows(sheets, spreadsheetId, tabName, appends);

    totalRecords += allItems.length;
    entityStats.push({ entity: 'order_items', tabName, count: allItems.length, success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error syncing Order Items';
    console.error('Error syncing Order Items:', err);
    entityStats.push({ entity: 'order_items', tabName: SHEET_TABS.ORDER_ITEMS, count: 0, success: false, error: errorMsg });
  }

  // 3. Expenses
  try {
    const tabName = SHEET_TABS.EXPENSES;
    const headers = SHEET_HEADERS[tabName];
    await ensureSheetWithHeaders(sheets, spreadsheetId, tabName, headers);

    const allExpenses = await db
      .select({
        id: expenses.id,
        expenseDate: expenses.expenseDate,
        title: expenses.title,
        description: expenses.description,
        amount: expenses.amount,
        referenceNumber: expenses.referenceNumber,
        categoryId: expenses.categoryId,
        paymentMethodId: expenses.paymentMethodId,
        categoryName: expenseCategories.name,
        paymentMethodName: paymentMethods.name,
        creatorName: users.name,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
        deletedAt: expenses.deletedAt,
      })
      .from(expenses)
      .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .leftJoin(paymentMethods, eq(expenses.paymentMethodId, paymentMethods.id))
      .leftJoin(users, eq(expenses.createdById, users.id))
      .orderBy(desc(expenses.expenseDate));

    const existingIds = await getSheetRowIds(sheets, spreadsheetId, tabName);
    const updates: { rowNumber: number; rowData: (string | number)[] }[] = [];
    const appends: (string | number)[][] = [];

    for (const exp of allExpenses) {
      const row = RowMapper.expense(exp as Record<string, unknown>, Boolean(exp.deletedAt));
      const existingRow = existingIds.get(exp.id);
      if (existingRow) {
        updates.push({ rowNumber: existingRow, rowData: row });
      } else {
        appends.push(row);
      }
    }

    if (updates.length > 0) await batchUpdateSheetRows(sheets, spreadsheetId, tabName, updates);
    if (appends.length > 0) await appendSheetRows(sheets, spreadsheetId, tabName, appends);

    totalRecords += allExpenses.length;
    entityStats.push({ entity: 'expenses', tabName, count: allExpenses.length, success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error syncing Expenses';
    console.error('Error syncing Expenses:', err);
    entityStats.push({ entity: 'expenses', tabName: SHEET_TABS.EXPENSES, count: 0, success: false, error: errorMsg });
  }

  // 4. Expense Attachments
  try {
    const tabName = SHEET_TABS.EXPENSE_ATTACHMENTS;
    const headers = SHEET_HEADERS[tabName];
    await ensureSheetWithHeaders(sheets, spreadsheetId, tabName, headers);

    const allAttachments = await db
      .select({
        id: expenseAttachments.id,
        expenseId: expenseAttachments.expenseId,
        fileName: expenseAttachments.fileName,
        fileUrl: expenseAttachments.fileUrl,
        fileType: expenseAttachments.fileType,
        fileSize: expenseAttachments.fileSize,
        uploaderName: users.name,
        createdAt: expenseAttachments.createdAt,
      })
      .from(expenseAttachments)
      .leftJoin(users, eq(expenseAttachments.uploadedById, users.id));

    const existingIds = await getSheetRowIds(sheets, spreadsheetId, tabName);
    const updates: { rowNumber: number; rowData: (string | number)[] }[] = [];
    const appends: (string | number)[][] = [];

    for (const att of allAttachments) {
      const row = RowMapper.expenseAttachment(att as Record<string, unknown>, false);
      const existingRow = existingIds.get(att.id);
      if (existingRow) {
        updates.push({ rowNumber: existingRow, rowData: row });
      } else {
        appends.push(row);
      }
    }

    if (updates.length > 0) await batchUpdateSheetRows(sheets, spreadsheetId, tabName, updates);
    if (appends.length > 0) await appendSheetRows(sheets, spreadsheetId, tabName, appends);

    totalRecords += allAttachments.length;
    entityStats.push({ entity: 'expense_attachments', tabName, count: allAttachments.length, success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error syncing Expense Attachments';
    console.error('Error syncing Expense Attachments:', err);
    entityStats.push({ entity: 'expense_attachments', tabName: SHEET_TABS.EXPENSE_ATTACHMENTS, count: 0, success: false, error: errorMsg });
  }

  // 5. Monthly Expenses
  try {
    const tabName = SHEET_TABS.MONTHLY_EXPENSES;
    const headers = SHEET_HEADERS[tabName];
    await ensureSheetWithHeaders(sheets, spreadsheetId, tabName, headers);

    const allEntries = await db
      .select({
        id: monthlyExpenseEntries.id,
        month: monthlyExpenseEntries.month,
        templateId: monthlyExpenseEntries.templateId,
        templateName: monthlyExpenseTemplates.name,
        name: monthlyExpenseEntries.name,
        category: monthlyExpenseEntries.category,
        expectedAmount: monthlyExpenseEntries.expectedAmount,
        actualAmount: monthlyExpenseEntries.actualAmount,
        dueDay: monthlyExpenseEntries.dueDay,
        status: monthlyExpenseEntries.status,
        paidDate: monthlyExpenseEntries.paidDate,
        paymentMethodId: monthlyExpenseEntries.paymentMethodId,
        paymentMethodName: paymentMethods.name,
        referenceNumber: monthlyExpenseEntries.referenceNumber,
        notes: monthlyExpenseEntries.notes,
        expenseId: monthlyExpenseEntries.expenseId,
        paidByName: users.name,
        createdAt: monthlyExpenseEntries.createdAt,
        updatedAt: monthlyExpenseEntries.updatedAt,
      })
      .from(monthlyExpenseEntries)
      .leftJoin(monthlyExpenseTemplates, eq(monthlyExpenseEntries.templateId, monthlyExpenseTemplates.id))
      .leftJoin(paymentMethods, eq(monthlyExpenseEntries.paymentMethodId, paymentMethods.id))
      .leftJoin(users, eq(monthlyExpenseEntries.paidById, users.id));

    const existingIds = await getSheetRowIds(sheets, spreadsheetId, tabName);
    const updates: { rowNumber: number; rowData: (string | number)[] }[] = [];
    const appends: (string | number)[][] = [];

    for (const entry of allEntries) {
      const row = RowMapper.monthlyExpenseEntry(entry as Record<string, unknown>, false);
      const existingRow = existingIds.get(entry.id);
      if (existingRow) {
        updates.push({ rowNumber: existingRow, rowData: row });
      } else {
        appends.push(row);
      }
    }

    if (updates.length > 0) await batchUpdateSheetRows(sheets, spreadsheetId, tabName, updates);
    if (appends.length > 0) await appendSheetRows(sheets, spreadsheetId, tabName, appends);

    totalRecords += allEntries.length;
    entityStats.push({ entity: 'monthly_expenses', tabName, count: allEntries.length, success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error syncing Monthly Expenses';
    console.error('Error syncing Monthly Expenses:', err);
    entityStats.push({ entity: 'monthly_expenses', tabName: SHEET_TABS.MONTHLY_EXPENSES, count: 0, success: false, error: errorMsg });
  }

  // 6. Monthly Expense Templates
  try {
    const tabName = SHEET_TABS.MONTHLY_EXPENSE_TEMPLATES;
    const headers = SHEET_HEADERS[tabName];
    await ensureSheetWithHeaders(sheets, spreadsheetId, tabName, headers);

    const allTemplates = await db
      .select({
        id: monthlyExpenseTemplates.id,
        name: monthlyExpenseTemplates.name,
        defaultAmount: monthlyExpenseTemplates.defaultAmount,
        dueDay: monthlyExpenseTemplates.dueDay,
        category: monthlyExpenseTemplates.category,
        paymentMethodId: monthlyExpenseTemplates.paymentMethodId,
        paymentMethodName: paymentMethods.name,
        isActive: monthlyExpenseTemplates.isActive,
        displayOrder: monthlyExpenseTemplates.displayOrder,
        notes: monthlyExpenseTemplates.notes,
        createdAt: monthlyExpenseTemplates.createdAt,
        updatedAt: monthlyExpenseTemplates.updatedAt,
      })
      .from(monthlyExpenseTemplates)
      .leftJoin(paymentMethods, eq(monthlyExpenseTemplates.paymentMethodId, paymentMethods.id));

    const existingIds = await getSheetRowIds(sheets, spreadsheetId, tabName);
    const updates: { rowNumber: number; rowData: (string | number)[] }[] = [];
    const appends: (string | number)[][] = [];

    for (const tmpl of allTemplates) {
      const row = RowMapper.monthlyExpenseTemplate(tmpl as Record<string, unknown>, false);
      const existingRow = existingIds.get(tmpl.id);
      if (existingRow) {
        updates.push({ rowNumber: existingRow, rowData: row });
      } else {
        appends.push(row);
      }
    }

    if (updates.length > 0) await batchUpdateSheetRows(sheets, spreadsheetId, tabName, updates);
    if (appends.length > 0) await appendSheetRows(sheets, spreadsheetId, tabName, appends);

    totalRecords += allTemplates.length;
    entityStats.push({ entity: 'monthly_expense_templates', tabName, count: allTemplates.length, success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error syncing Monthly Expense Templates';
    console.error('Error syncing Monthly Expense Templates:', err);
    entityStats.push({ entity: 'monthly_expense_templates', tabName: SHEET_TABS.MONTHLY_EXPENSE_TEMPLATES, count: 0, success: false, error: errorMsg });
  }

  // 7. Meta Ads Transactions
  try {
    const tabName = SHEET_TABS.META_ADS;
    const headers = SHEET_HEADERS[tabName];
    await ensureSheetWithHeaders(sheets, spreadsheetId, tabName, headers);

    const allMetaTxns = await db
      .select({
        id: metaAdsTransactions.id,
        weekStartDate: metaAdsTransactions.weekStartDate,
        weekEndDate: metaAdsTransactions.weekEndDate,
        dailyBudget: metaAdsTransactions.dailyBudget,
        calculatedWeeklyBudget: metaAdsTransactions.calculatedWeeklyBudget,
        amountPaid: metaAdsTransactions.amountPaid,
        paymentDate: metaAdsTransactions.paymentDate,
        paymentMethodId: metaAdsTransactions.paymentMethodId,
        paymentMethodName: paymentMethods.name,
        status: metaAdsTransactions.status,
        referenceNumber: metaAdsTransactions.referenceNumber,
        notes: metaAdsTransactions.notes,
        expenseId: metaAdsTransactions.expenseId,
        creatorName: users.name,
        createdAt: metaAdsTransactions.createdAt,
        updatedAt: metaAdsTransactions.updatedAt,
      })
      .from(metaAdsTransactions)
      .leftJoin(paymentMethods, eq(metaAdsTransactions.paymentMethodId, paymentMethods.id))
      .leftJoin(users, eq(metaAdsTransactions.createdById, users.id));

    const existingIds = await getSheetRowIds(sheets, spreadsheetId, tabName);
    const updates: { rowNumber: number; rowData: (string | number)[] }[] = [];
    const appends: (string | number)[][] = [];

    for (const mTxn of allMetaTxns) {
      const row = RowMapper.metaAdsTransaction(mTxn as Record<string, unknown>, false);
      const existingRow = existingIds.get(mTxn.id);
      if (existingRow) {
        updates.push({ rowNumber: existingRow, rowData: row });
      } else {
        appends.push(row);
      }
    }

    if (updates.length > 0) await batchUpdateSheetRows(sheets, spreadsheetId, tabName, updates);
    if (appends.length > 0) await appendSheetRows(sheets, spreadsheetId, tabName, appends);

    totalRecords += allMetaTxns.length;
    entityStats.push({ entity: 'meta_ads', tabName, count: allMetaTxns.length, success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error syncing Meta Ads';
    console.error('Error syncing Meta Ads:', err);
    entityStats.push({ entity: 'meta_ads', tabName: SHEET_TABS.META_ADS, count: 0, success: false, error: errorMsg });
  }

  // 8. Partners
  try {
    const tabName = SHEET_TABS.PARTNERS;
    const headers = SHEET_HEADERS[tabName];
    await ensureSheetWithHeaders(sheets, spreadsheetId, tabName, headers);

    const allPartners = await db.select().from(partners);
    const existingIds = await getSheetRowIds(sheets, spreadsheetId, tabName);

    const updates: { rowNumber: number; rowData: (string | number)[] }[] = [];
    const appends: (string | number)[][] = [];

    for (const p of allPartners) {
      const row = RowMapper.partner(p as Record<string, unknown>, false);
      const existingRow = existingIds.get(p.id);
      if (existingRow) {
        updates.push({ rowNumber: existingRow, rowData: row });
      } else {
        appends.push(row);
      }
    }

    if (updates.length > 0) await batchUpdateSheetRows(sheets, spreadsheetId, tabName, updates);
    if (appends.length > 0) await appendSheetRows(sheets, spreadsheetId, tabName, appends);

    totalRecords += allPartners.length;
    entityStats.push({ entity: 'partners', tabName, count: allPartners.length, success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error syncing Partners';
    console.error('Error syncing Partners:', err);
    entityStats.push({ entity: 'partners', tabName: SHEET_TABS.PARTNERS, count: 0, success: false, error: errorMsg });
  }

  // 9. Partner Transactions & Payouts
  try {
    const tabName = SHEET_TABS.PARTNER_TRANSACTIONS;
    const headers = SHEET_HEADERS[tabName];
    await ensureSheetWithHeaders(sheets, spreadsheetId, tabName, headers);

    const payoutsTab = SHEET_TABS.PAYOUTS;
    const payoutsHeaders = SHEET_HEADERS[payoutsTab];
    await ensureSheetWithHeaders(sheets, spreadsheetId, payoutsTab, payoutsHeaders);

    const allPartnerTxns = await db
      .select({
        id: partnerTransactions.id,
        partnerId: partnerTransactions.partnerId,
        partnerName: partners.name,
        type: partnerTransactions.type,
        amount: partnerTransactions.amount,
        transactionDate: partnerTransactions.transactionDate,
        paymentMethodId: partnerTransactions.paymentMethodId,
        paymentMethodName: paymentMethods.name,
        status: partnerTransactions.status,
        referenceNumber: partnerTransactions.referenceNumber,
        notes: partnerTransactions.notes,
        creatorName: users.name,
        createdAt: partnerTransactions.createdAt,
        updatedAt: partnerTransactions.updatedAt,
      })
      .from(partnerTransactions)
      .leftJoin(partners, eq(partnerTransactions.partnerId, partners.id))
      .leftJoin(paymentMethods, eq(partnerTransactions.paymentMethodId, paymentMethods.id))
      .leftJoin(users, eq(partnerTransactions.createdById, users.id));

    const existingIds = await getSheetRowIds(sheets, spreadsheetId, tabName);
    const existingPayoutIds = await getSheetRowIds(sheets, spreadsheetId, payoutsTab);

    const updates: { rowNumber: number; rowData: (string | number)[] }[] = [];
    const appends: (string | number)[][] = [];

    const payoutUpdates: { rowNumber: number; rowData: (string | number)[] }[] = [];
    const payoutAppends: (string | number)[][] = [];

    for (const pTxn of allPartnerTxns) {
      const row = RowMapper.partnerTransaction(pTxn as Record<string, unknown>, false);
      const existingRow = existingIds.get(pTxn.id);
      if (existingRow) {
        updates.push({ rowNumber: existingRow, rowData: row });
      } else {
        appends.push(row);
      }

      if (pTxn.type === 'PAYOUT') {
        const existingPayoutRow = existingPayoutIds.get(pTxn.id);
        if (existingPayoutRow) {
          payoutUpdates.push({ rowNumber: existingPayoutRow, rowData: row });
        } else {
          payoutAppends.push(row);
        }
      }
    }

    if (updates.length > 0) await batchUpdateSheetRows(sheets, spreadsheetId, tabName, updates);
    if (appends.length > 0) await appendSheetRows(sheets, spreadsheetId, tabName, appends);

    if (payoutUpdates.length > 0) await batchUpdateSheetRows(sheets, spreadsheetId, payoutsTab, payoutUpdates);
    if (payoutAppends.length > 0) await appendSheetRows(sheets, spreadsheetId, payoutsTab, payoutAppends);

    totalRecords += allPartnerTxns.length;
    entityStats.push({ entity: 'partner_transactions', tabName, count: allPartnerTxns.length, success: true });
    entityStats.push({ entity: 'payouts', tabName: payoutsTab, count: payoutUpdates.length + payoutAppends.length, success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error syncing Partner Transactions';
    console.error('Error syncing Partner Transactions:', err);
    entityStats.push({ entity: 'partner_transactions', tabName: SHEET_TABS.PARTNER_TRANSACTIONS, count: 0, success: false, error: errorMsg });
  }

  // 10. Order Issues
  try {
    const tabName = SHEET_TABS.ORDER_ISSUES;
    const headers = SHEET_HEADERS[tabName];
    await ensureSheetWithHeaders(sheets, spreadsheetId, tabName, headers);

    const allIssues = await db
      .select({
        id: orderIssues.id,
        orderId: orderIssues.orderId,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        categoryName: issueCategories.name,
        title: orderIssues.title,
        description: orderIssues.description,
        status: orderIssues.status,
        priority: orderIssues.priority,
        assignedToName: users.name,
        creatorName: users.name,
        resolverName: users.name,
        createdAt: orderIssues.createdAt,
        updatedAt: orderIssues.updatedAt,
        resolvedAt: orderIssues.resolvedAt,
        closedAt: orderIssues.closedAt,
      })
      .from(orderIssues)
      .leftJoin(orders, eq(orderIssues.orderId, orders.id))
      .leftJoin(issueCategories, eq(orderIssues.categoryId, issueCategories.id))
      .leftJoin(users, eq(orderIssues.createdById, users.id));

    const existingIds = await getSheetRowIds(sheets, spreadsheetId, tabName);
    const updates: { rowNumber: number; rowData: (string | number)[] }[] = [];
    const appends: (string | number)[][] = [];

    for (const issue of allIssues) {
      const row = RowMapper.orderIssue(issue as Record<string, unknown>, false);
      const existingRow = existingIds.get(issue.id);
      if (existingRow) {
        updates.push({ rowNumber: existingRow, rowData: row });
      } else {
        appends.push(row);
      }
    }

    if (updates.length > 0) await batchUpdateSheetRows(sheets, spreadsheetId, tabName, updates);
    if (appends.length > 0) await appendSheetRows(sheets, spreadsheetId, tabName, appends);

    totalRecords += allIssues.length;
    entityStats.push({ entity: 'order_issues', tabName, count: allIssues.length, success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error syncing Order Issues';
    console.error('Error syncing Order Issues:', err);
    entityStats.push({ entity: 'order_issues', tabName: SHEET_TABS.ORDER_ISSUES, count: 0, success: false, error: errorMsg });
  }

  const completedTime = new Date();
  const durationMs = completedTime.getTime() - startTime.getTime();

  // Record Full Sync in Backup Log
  await recordBackupLog(sheets, spreadsheetId, {
    timestamp: startTime,
    entity: 'ALL',
    databaseId: 'FULL_SYNC',
    operation: 'FULL_SYNC',
    status: 'SUCCESS',
    attempt: 1,
    error: `Full sync completed: ${totalRecords} records across ${entityStats.length} tabs in ${(durationMs / 1000).toFixed(1)}s`,
  });

  return {
    success: true,
    entities: entityStats,
    totalRecords,
    startedAt: startTime.toISOString(),
    completedAt: completedTime.toISOString(),
    durationMs,
  };
}
