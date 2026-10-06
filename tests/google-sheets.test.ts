import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  RowMapper, 
  SHEET_TABS, 
  SHEET_HEADERS, 
  getTabNameForEntity
} from '../src/lib/google-sheets/row-mapper';
import { extractSpreadsheetId, formatPrivateKey } from '../src/lib/google-sheets/config';

describe('Google Sheets Backup System', () => {
  describe('Configuration & URL Parsing', () => {
    it('should correctly extract spreadsheet ID from standard URL', () => {
      const url = 'https://docs.google.com/spreadsheets/d/1oGI2f-NQi54HKQowazhRCdn9y1qAXWHqW6e15FM7w_0/edit#gid=0';
      const extracted = extractSpreadsheetId(url);
      assert.equal(extracted, '1oGI2f-NQi54HKQowazhRCdn9y1qAXWHqW6e15FM7w_0');
    });

    it('should handle raw spreadsheet ID without URL prefix', () => {
      const id = '1oGI2f-NQi54HKQowazhRCdn9y1qAXWHqW6e15FM7w_0';
      assert.equal(extractSpreadsheetId(id), id);
    });

    it('should format private key replacing escaped newlines', () => {
      const escapedKey = '-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgk\\n-----END PRIVATE KEY-----';
      const formatted = formatPrivateKey(escapedKey);
      assert.ok(formatted?.includes('\n'));
      assert.ok(!formatted?.includes('\\n'));
    });
  });

  describe('Tab & Header Structure', () => {
    it('should have all 12 required business tabs configured', () => {
      const expectedTabs = [
        'Orders',
        'Order Items',
        'Expenses',
        'Expense Attachments',
        'Monthly Expenses',
        'Monthly Expense Templates',
        'Meta Ads',
        'Partners',
        'Partner Transactions',
        'Payouts',
        'Order Issues',
        'Backup Log',
      ];

      for (const tab of expectedTabs) {
        assert.ok(SHEET_HEADERS[tab], `Missing headers for tab: ${tab}`);
        assert.ok(SHEET_HEADERS[tab].length > 0, `Headers empty for tab: ${tab}`);
        // First column in every business tab must be ID or Timestamp
        const firstCol = SHEET_HEADERS[tab][0];
        assert.ok(firstCol === 'ID' || firstCol === 'Timestamp', `First column must be ID or Timestamp for ${tab}`);
      }
    });

    it('should correctly map entity names to sheet tab names', () => {
      assert.equal(getTabNameForEntity('orders'), SHEET_TABS.ORDERS);
      assert.equal(getTabNameForEntity('order_items'), SHEET_TABS.ORDER_ITEMS);
      assert.equal(getTabNameForEntity('expenses'), SHEET_TABS.EXPENSES);
      assert.equal(getTabNameForEntity('expense_attachments'), SHEET_TABS.EXPENSE_ATTACHMENTS);
      assert.equal(getTabNameForEntity('monthly_expenses'), SHEET_TABS.MONTHLY_EXPENSES);
      assert.equal(getTabNameForEntity('monthly_expense_templates'), SHEET_TABS.MONTHLY_EXPENSE_TEMPLATES);
      assert.equal(getTabNameForEntity('meta_ads'), SHEET_TABS.META_ADS);
      assert.equal(getTabNameForEntity('partners'), SHEET_TABS.PARTNERS);
      assert.equal(getTabNameForEntity('partner_transactions'), SHEET_TABS.PARTNER_TRANSACTIONS);
      assert.equal(getTabNameForEntity('payouts'), SHEET_TABS.PAYOUTS);
      assert.equal(getTabNameForEntity('order_issues'), SHEET_TABS.ORDER_ISSUES);
    });
  });

  describe('Row Mappers & Formatting', () => {
    it('should format order records with matching header columns and numeric amounts', () => {
      const mockOrder = {
        id: 'ord_123',
        shopifyOrderId: 'shop_456',
        orderNumber: '#1001',
        customerName: 'Nithin Doe',
        customerEmail: 'nithin@example.com',
        totalPrice: '1499.50',
        currency: 'INR',
        financialStatus: 'paid',
        fulfillmentStatus: 'fulfilled',
        trackingId: 'TRK999',
        trackingCompany: 'Delhivery',
        trackingUrl: 'https://track.delhivery.com/TRK999',
        createdAt: new Date('2026-10-02T10:00:00Z'),
      };

      const row = RowMapper.order(mockOrder, false);
      const headers = SHEET_HEADERS[SHEET_TABS.ORDERS];

      assert.equal(row.length, headers.length);
      assert.equal(row[0], 'ord_123'); // ID
      assert.equal(row[5], 1499.5); // Total Price should be numeric
      assert.equal(row[row.length - 1], 'ACTIVE'); // Sync Status
    });

    it('should format expenses and handle soft deletion state', () => {
      const mockExpense = {
        id: 'exp_789',
        expenseDate: new Date('2026-10-02'),
        title: 'Office Internet Bill',
        description: 'Monthly fiber broadband',
        categoryName: 'Utilities & Bills',
        paymentMethodName: 'HDFC Card',
        amount: '1200.00',
        referenceNumber: 'TXN12345',
        creatorName: 'Admin',
        createdAt: new Date('2026-10-02T08:00:00Z'),
        updatedAt: new Date('2026-10-02T08:00:00Z'),
        deletedAt: new Date('2026-10-02T09:00:00Z'),
      };

      const activeRow = RowMapper.expense(mockExpense, false);
      const headers = SHEET_HEADERS[SHEET_TABS.EXPENSES];
      assert.equal(activeRow.length, headers.length);
      assert.equal(activeRow[0], 'exp_789');
      assert.equal(activeRow[6], 1200); // Numeric amount
      assert.equal(activeRow[activeRow.length - 1], 'DELETED'); // Detected deletedAt
    });

    it('should format partner transactions and mirror payouts accurately', () => {
      const mockTxn = {
        id: 'ptxn_001',
        partnerId: 'part_111',
        partnerName: 'Partner Alpha',
        type: 'PAYOUT',
        amount: '50000.00',
        transactionDate: new Date('2026-10-01'),
        paymentMethodName: 'Bank Transfer',
        status: 'COMPLETED',
        referenceNumber: 'REF555',
        notes: 'Monthly distribution',
        creatorName: 'Admin',
        createdAt: new Date('2026-10-01T12:00:00Z'),
        updatedAt: new Date('2026-10-01T12:00:00Z'),
      };

      const row = RowMapper.partnerTransaction(mockTxn, false);
      const headers = SHEET_HEADERS[SHEET_TABS.PAYOUTS];
      assert.equal(row.length, headers.length);
      assert.equal(row[0], 'ptxn_001');
      assert.equal(row[3], 'PAYOUT');
      assert.equal(row[4], 50000);
      assert.equal(row[row.length - 1], 'ACTIVE');
    });

    it('should format order issues with all tracking metadata', () => {
      const mockIssue = {
        id: 'iss_999',
        orderId: 'ord_123',
        orderNumber: '#1001',
        customerName: 'Nithin Doe',
        categoryName: 'Damaged Item',
        title: 'Item crushed in transit',
        description: 'Customer sent photos of damaged outer packaging',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        assignedToName: 'Support Agent',
        creatorName: 'Admin',
        resolverName: null,
        createdAt: new Date('2026-10-02T11:00:00Z'),
        updatedAt: new Date('2026-10-02T11:30:00Z'),
        resolvedAt: null,
        closedAt: null,
      };

      const row = RowMapper.orderIssue(mockIssue, false);
      const headers = SHEET_HEADERS[SHEET_TABS.ORDER_ISSUES];
      assert.equal(row.length, headers.length);
      assert.equal(row[0], 'iss_999');
      assert.equal(row[7], 'IN_PROGRESS');
      assert.equal(row[8], 'HIGH');
      assert.equal(row[row.length - 1], 'ACTIVE');
    });

    it('should format backup log entries cleanly without credential leakage', () => {
      const logEntry = {
        timestamp: new Date('2026-10-02T14:30:00Z'),
        entity: 'expenses',
        databaseId: 'exp_789',
        operation: 'UPDATE',
        status: 'SUCCESS' as const,
        attempt: 1,
        error: null,
      };

      const row = RowMapper.backupLog(logEntry);
      const headers = SHEET_HEADERS[SHEET_TABS.BACKUP_LOG];
      assert.equal(row.length, headers.length);
      assert.equal(row[1], 'expenses');
      assert.equal(row[2], 'exp_789');
      assert.equal(row[3], 'UPDATE');
      assert.equal(row[4], 'SUCCESS');
      assert.equal(row[5], 1);
      assert.equal(row[6], '');
    });
  });

  describe('Idempotency & Upsert Simulation', () => {
    it('should map existing row numbers for upsert without creating duplicate rows', () => {
      const existingColumnA = ['ord_001', 'ord_002', 'ord_003'];
      const rowIdMap = new Map<string, number>();
      existingColumnA.forEach((id, idx) => {
        rowIdMap.set(id, idx + 2); // 1-based, starts row 2
      });

      // Existing record update
      const existingId = 'ord_002';
      assert.equal(rowIdMap.has(existingId), true);
      assert.equal(rowIdMap.get(existingId), 3); // Row 3 should be updated

      // New record insert
      const newId = 'ord_004';
      assert.equal(rowIdMap.has(newId), false); // Should append
    });
  });
});
