import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { sheets_v4 } from 'googleapis';
import {
  getSpreadsheetMetadata,
  ensureSheetWithHeaders,
  getSheetRowIds,
  appendSheetRows,
  recordBackupLog,
  clearSpreadsheetCache,
} from '../src/lib/google-sheets/sheets';
import {
  getGoogleSheetsMetrics,
  resetGoogleSheetsMetrics,
  formatSheetsError,
  isQuotaExceededError,
} from '../src/lib/google-sheets/metrics';

describe('Google Sheets Quota & Performance Optimization', () => {
  beforeEach(() => {
    clearSpreadsheetCache();
    resetGoogleSheetsMetrics();
  });

  describe('Spreadsheet Metadata Caching', () => {
    it('should fetch metadata only once and use cache for subsequent calls', async () => {
      let getCallCount = 0;
      const mockSpreadsheetId = 'test-spreadsheet-123';

      const mockSheets = {
        spreadsheets: {
          get: async () => {
            getCallCount++;
            return {
              data: {
                properties: { title: 'Test Sheet' },
                sheets: [
                  { properties: { sheetId: 0, title: 'Orders' } },
                  { properties: { sheetId: 1, title: 'Order Items' } },
                ],
              },
            };
          },
        },
      } as unknown as sheets_v4.Sheets;

      // First call (cache miss)
      const meta1 = await getSpreadsheetMetadata(mockSheets, mockSpreadsheetId);
      assert.equal(getCallCount, 1);
      assert.equal(meta1.sheets.size, 2);

      // Second call (cache hit)
      const meta2 = await getSpreadsheetMetadata(mockSheets, mockSpreadsheetId);
      assert.equal(getCallCount, 1, 'Should NOT call spreadsheets.get on second invocation');
      assert.equal(meta2.sheets.get('Orders')?.sheetId, 0);

      // 100 repeated calls for various records
      for (let i = 0; i < 100; i++) {
        await ensureSheetWithHeaders(mockSheets, mockSpreadsheetId, 'Orders', ['ID', 'Name']);
      }
      assert.equal(getCallCount, 1, 'Should remain 1 across 100 ensureSheetWithHeaders calls');

      const metrics = getGoogleSheetsMetrics();
      assert.equal(metrics.metadataCacheMisses, 1);
      assert.ok(metrics.metadataCacheHits >= 100);
    });

    it('should deduplicate in-flight metadata fetch promises', async () => {
      let getCallCount = 0;
      const mockSpreadsheetId = 'test-concurrent-123';

      const mockSheets = {
        spreadsheets: {
          get: async () => {
            getCallCount++;
            // Simulate 50ms network delay
            await new Promise((resolve) => setTimeout(resolve, 50));
            return {
              data: {
                sheets: [{ properties: { sheetId: 10, title: 'Orders' } }],
              },
            };
          },
        },
      } as unknown as sheets_v4.Sheets;

      // 10 concurrent requests triggered at the exact same moment
      const results = await Promise.all(
        Array.from({ length: 10 }).map(() =>
          getSpreadsheetMetadata(mockSheets, mockSpreadsheetId)
        )
      );

      assert.equal(getCallCount, 1, 'Concurrent burst must generate only 1 API call');
      assert.equal(results.length, 10);
      assert.equal(results[0].sheets.get('Orders')?.sheetId, 10);
    });
  });

  describe('Race-Safe Sheet Creation', () => {
    it('should deduplicate concurrent creation requests for the same tab', async () => {
      let addSheetCount = 0;
      let valuesUpdateCount = 0;
      const mockSpreadsheetId = 'test-create-race';

      const mockSheets = {
        spreadsheets: {
          get: async () => ({
            data: {
              sheets: [], // Start with no sheets
            },
          }),
          batchUpdate: async (params: { requestBody?: { requests?: Array<{ addSheet?: unknown }> } }) => {
            if (params.requestBody?.requests?.[0]?.addSheet) {
              addSheetCount++;
              await new Promise((resolve) => setTimeout(resolve, 30));
              return {
                data: {
                  replies: [{ addSheet: { properties: { sheetId: 999 } } }],
                },
              };
            }
            return { data: {} };
          },
          values: {
            update: async () => {
              valuesUpdateCount++;
              return { data: {} };
            },
          },
        },
      } as unknown as sheets_v4.Sheets;

      // 5 concurrent requests all wanting to ensure tab 'Expenses'
      const results = await Promise.all(
        Array.from({ length: 5 }).map(() =>
          ensureSheetWithHeaders(mockSheets, mockSpreadsheetId, 'Expenses', ['ID', 'Amount'])
        )
      );

      assert.equal(addSheetCount, 1, 'Must create sheet tab only once');
      assert.equal(valuesUpdateCount, 1, 'Must write headers only once');
      assert.equal(results[0].sheetId, 999);
      assert.equal(results[4].sheetId, 999);

      const metrics = getGoogleSheetsMetrics();
      assert.equal(metrics.sheetCreations, 1);
    });
  });

  describe('Row ID Caching & Incremental Update', () => {
    it('should cache row IDs and update incrementally on append without extra reads', async () => {
      let valuesGetCount = 0;
      let valuesAppendCount = 0;
      const mockSpreadsheetId = 'test-row-cache';

      const mockSheets = {
        spreadsheets: {
          values: {
            get: async () => {
              valuesGetCount++;
              return {
                data: {
                  values: [['ord_101'], ['ord_102']],
                },
              };
            },
            append: async () => {
              valuesAppendCount++;
              return { data: {} };
            },
          },
        },
      } as unknown as sheets_v4.Sheets;

      // 1. Initial lookup
      const rowIds1 = await getSheetRowIds(mockSheets, mockSpreadsheetId, 'Orders');
      assert.equal(valuesGetCount, 1);
      assert.equal(rowIds1.get('ord_101'), 2);
      assert.equal(rowIds1.get('ord_102'), 3);

      // 2. Second lookup (cached)
      const rowIdsCached = await getSheetRowIds(mockSheets, mockSpreadsheetId, 'Orders');
      assert.equal(valuesGetCount, 1, 'Should use cached row IDs');
      assert.equal(rowIdsCached.size, 2);

      // 3. Append new rows
      await appendSheetRows(mockSheets, mockSpreadsheetId, 'Orders', [
        ['ord_103', 'Product A'],
        ['ord_104', 'Product B'],
      ]);
      assert.equal(valuesAppendCount, 1);

      // 4. Third lookup (should have updated row numbers without reading from API)
      const rowIds3 = await getSheetRowIds(mockSheets, mockSpreadsheetId, 'Orders');
      assert.equal(valuesGetCount, 1, 'Should NOT call values.get after append');
      assert.equal(rowIds3.get('ord_103'), 4);
      assert.equal(rowIds3.get('ord_104'), 5);
    });
  });

  describe('429 Quota Error Detection & Recovery', () => {
    it('should accurately detect 429 quota exhaustion errors', () => {
      const gaxiosError = {
        status: 429,
        cause: {
          code: 429,
          message: "Quota exceeded for quota metric 'Read requests' and limit 'Read requests per minute per user' of service 'sheets.googleapis.com'",
        },
      };

      assert.ok(isQuotaExceededError(gaxiosError));
      assert.ok(formatSheetsError(gaxiosError).includes('429 Quota Exceeded'));
    });

    it('should format general errors concisely without dumping secrets or huge objects', () => {
      const err = new Error('Network timeout contacting sheets.googleapis.com');
      const formatted = formatSheetsError(err);
      assert.equal(formatted, 'Network timeout contacting sheets.googleapis.com');
    });
  });

  describe('Backup Log Quota Safety', () => {
    it('should fail silently and gracefully if Backup Log encounters a 429 error', async () => {
      const mockSpreadsheetId = 'test-backup-log';

      const mockSheets = {
        spreadsheets: {
          get: async () => ({
            data: {
              sheets: [{ properties: { sheetId: 100, title: 'Backup Log' } }],
            },
          }),
          values: {
            append: async () => {
              const err = new Error("Quota exceeded for quota metric 'Read requests'") as Error & { status?: number };
              err.status = 429;
              throw err;
            },
          },
        },
      } as unknown as sheets_v4.Sheets;

      // recordBackupLog should NEVER throw
      await assert.doesNotReject(async () => {
        await recordBackupLog(mockSheets, mockSpreadsheetId, {
          timestamp: new Date(),
          entity: 'orders',
          databaseId: 'ord_999',
          operation: 'UPDATE',
          status: 'SUCCESS',
          attempt: 1,
        });
      });

      const metrics = getGoogleSheetsMetrics();
      assert.equal(metrics.quota429Errors, 1);
    });
  });
});
