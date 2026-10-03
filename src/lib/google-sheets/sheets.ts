import { sheets_v4 } from 'googleapis';
import { SHEET_TABS, SHEET_HEADERS, RowMapper } from './row-mapper';
import { BackupLogEntry } from './types';
import { incrementMetric, formatSheetsError, isQuotaExceededError } from './metrics';

export interface CachedSheetInfo {
  sheetId: number;
  title: string;
  headersInitialized: boolean;
}

export interface SpreadsheetMetadata {
  spreadsheetId: string;
  title?: string;
  sheets: Map<string, CachedSheetInfo>;
  fetchedAt: number;
}

// In-memory cache for spreadsheet metadata keyed by spreadsheetId
const sheetMetadataCache = new Map<string, SpreadsheetMetadata>();
// In-flight metadata fetch promises to deduplicate simultaneous requests
const metadataPromises = new Map<string, Promise<SpreadsheetMetadata>>();
// Per-sheet creation lock to prevent race conditions during concurrent tab creations
const sheetCreationLocks = new Map<string, Promise<CachedSheetInfo>>();

// In-memory cache for sheet row IDs (Column A database IDs -> row numbers)
interface CachedRowIds {
  map: Map<string, number>;
  highestRowNumber: number;
  fetchedAt: number;
}
const rowIdCache = new Map<string, CachedRowIds>();
const ROW_ID_CACHE_TTL_MS = 60000; // 60 seconds TTL

/**
 * Retrieves cached spreadsheet metadata or fetches it from Google Sheets API if not cached.
 * Deduplicates simultaneous calls using a shared Promise.
 */
export async function getSpreadsheetMetadata(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  forceRefresh = false
): Promise<SpreadsheetMetadata> {
  if (!forceRefresh) {
    const cached = sheetMetadataCache.get(spreadsheetId);
    if (cached) {
      incrementMetric('metadataCacheHits');
      return cached;
    }
  }

  // Deduplicate in-flight requests for the same spreadsheetId
  const existingPromise = metadataPromises.get(spreadsheetId);
  if (existingPromise && !forceRefresh) {
    return existingPromise;
  }

  const fetchPromise = (async () => {
    try {
      incrementMetric('metadataCacheMisses');
      console.log(`[Google Sheets] Fetching spreadsheet metadata for ${spreadsheetId}...`);

      const response = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'properties.title,sheets.properties(sheetId,title)',
      });

      const sheetsMap = new Map<string, CachedSheetInfo>();
      const existingSheets = response.data.sheets || [];

      for (const s of existingSheets) {
        if (s.properties && s.properties.title) {
          const sheetId = s.properties.sheetId ?? 0;
          const title = s.properties.title;
          sheetsMap.set(title, {
            sheetId,
            title,
            headersInitialized: true,
          });
        }
      }

      const meta: SpreadsheetMetadata = {
        spreadsheetId,
        title: response.data.properties?.title ?? undefined,
        sheets: sheetsMap,
        fetchedAt: Date.now(),
      };

      sheetMetadataCache.set(spreadsheetId, meta);
      return meta;
    } finally {
      metadataPromises.delete(spreadsheetId);
    }
  })();

  metadataPromises.set(spreadsheetId, fetchPromise);
  return fetchPromise;
}

/**
 * Ensures that the given sheet tab exists in the spreadsheet with appropriate headers.
 * Uses cached metadata and deduplicated sheet creation locks to avoid redundant API calls.
 */
export async function ensureSheetWithHeaders(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetName: string,
  headers: string[]
): Promise<CachedSheetInfo> {
  // 1. Check in-memory metadata cache first
  const meta = await getSpreadsheetMetadata(sheets, spreadsheetId);
  const existing = meta.sheets.get(sheetName);

  if (existing && existing.headersInitialized) {
    return existing;
  }

  // 2. If tab exists but headers not marked initialized (rare), write headers once
  if (existing && !existing.headersInitialized) {
    try {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${sheetName}'!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [headers],
        },
      });
      existing.headersInitialized = true;
    } catch (err) {
      console.warn(`[Google Sheets] Warning writing headers for existing tab "${sheetName}": ${formatSheetsError(err)}`);
    }
    return existing;
  }

  // 3. Tab doesn't exist, create it with race-condition lock
  const lockKey = `${spreadsheetId}:${sheetName}`;
  const existingCreation = sheetCreationLocks.get(lockKey);
  if (existingCreation) {
    return existingCreation;
  }

  const creationPromise = (async (): Promise<CachedSheetInfo> => {
    try {
      console.log(`[Google Sheets] Creating missing sheet tab "${sheetName}"...`);
      const addSheetResponse = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                  gridProperties: {
                    frozenRowCount: 1,
                  },
                },
              },
            },
          ],
        },
      });

      const newSheetId = addSheetResponse.data.replies?.[0]?.addSheet?.properties?.sheetId ?? 0;

      // Write header values
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${sheetName}'!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [headers],
        },
      });

      // Format header row (bold, background color)
      if (newSheetId !== undefined) {
        try {
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
              requests: [
                {
                  repeatCell: {
                    range: {
                      sheetId: newSheetId,
                      startRowIndex: 0,
                      endRowIndex: 1,
                      startColumnIndex: 0,
                      endColumnIndex: headers.length,
                    },
                    cell: {
                      userEnteredFormat: {
                        backgroundColor: { red: 0.12, green: 0.12, blue: 0.12 },
                        textFormat: {
                          bold: true,
                          foregroundColor: { red: 1, green: 1, blue: 1 },
                        },
                      },
                    },
                    fields: 'userEnteredFormat(backgroundColor,textFormat)',
                  },
                },
              ],
            },
          });
        } catch (styleErr) {
          console.warn(`[Google Sheets] Header styling skipped for "${sheetName}": ${formatSheetsError(styleErr)}`);
        }
      }

      const cachedInfo: CachedSheetInfo = {
        sheetId: newSheetId,
        title: sheetName,
        headersInitialized: true,
      };

      meta.sheets.set(sheetName, cachedInfo);
      incrementMetric('sheetCreations');
      return cachedInfo;
    } finally {
      sheetCreationLocks.delete(lockKey);
    }
  })();

  sheetCreationLocks.set(lockKey, creationPromise);
  return creationPromise;
}

/**
 * Reads column A of a sheet tab and returns a Map of Database ID -> 1-based Row Number.
 * Caches results in memory for ROW_ID_CACHE_TTL_MS to avoid reading on every single row sync.
 */
export async function getSheetRowIds(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetName: string,
  forceRefresh = false
): Promise<Map<string, number>> {
  const cacheKey = `${spreadsheetId}:${sheetName}`;
  const now = Date.now();

  if (!forceRefresh) {
    const cached = rowIdCache.get(cacheKey);
    if (cached && now - cached.fetchedAt < ROW_ID_CACHE_TTL_MS) {
      return cached.map;
    }
  }

  const rowIdMap = new Map<string, number>();
  let highestRow = 1;

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!A2:A`,
    });

    const rows = res.data.values || [];
    for (let i = 0; i < rows.length; i++) {
      const idVal = rows[i]?.[0];
      const rowNum = i + 2;
      if (idVal !== undefined && idVal !== null && String(idVal).trim().length > 0) {
        const id = String(idVal).trim();
        rowIdMap.set(id, rowNum);
      }
      highestRow = Math.max(highestRow, rowNum);
    }

    rowIdCache.set(cacheKey, {
      map: rowIdMap,
      highestRowNumber: highestRow,
      fetchedAt: now,
    });
  } catch (err) {
    console.warn(`[Google Sheets] Could not read row IDs for sheet "${sheetName}": ${formatSheetsError(err)}`);
  }

  return rowIdMap;
}

/**
 * Updates a specific row in a sheet tab
 */
export async function updateSheetRow(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetName: string,
  rowNumber: number,
  rowData: (string | number)[]
): Promise<void> {
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${sheetName}'!A${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [rowData],
    },
  });
}

/**
 * Appends new rows to a sheet tab and updates the in-memory row ID cache
 */
export async function appendSheetRows(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetName: string,
  rowsData: (string | number)[][]
): Promise<void> {
  if (rowsData.length === 0) return;

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${sheetName}'!A1`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: rowsData,
    },
  });

  // Incrementally update the row ID cache so subsequent queries have the new row numbers without a read
  const cacheKey = `${spreadsheetId}:${sheetName}`;
  const cached = rowIdCache.get(cacheKey);
  if (cached) {
    let nextRow = cached.highestRowNumber + 1;
    for (const row of rowsData) {
      const idVal = row[0];
      if (idVal !== undefined && idVal !== null && String(idVal).trim().length > 0) {
        cached.map.set(String(idVal).trim(), nextRow);
      }
      nextRow++;
    }
    cached.highestRowNumber = nextRow - 1;
  }
}

/**
 * Batch updates multiple existing rows in a sheet tab
 */
export async function batchUpdateSheetRows(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetName: string,
  updates: { rowNumber: number; rowData: (string | number)[] }[]
): Promise<void> {
  if (updates.length === 0) return;

  const data = updates.map((u) => ({
    range: `'${sheetName}'!A${u.rowNumber}`,
    values: [u.rowData],
  }));

  const chunkSize = 100;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: chunk,
      },
    });
  }
}

/**
 * Appends a log entry to the 'Backup Log' sheet tab.
 * Non-blocking, quota-aware, and failure-tolerant: never throws to the caller.
 */
export async function recordBackupLog(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  entry: BackupLogEntry
): Promise<void> {
  try {
    await ensureSheetWithHeaders(
      sheets,
      spreadsheetId,
      SHEET_TABS.BACKUP_LOG,
      SHEET_HEADERS[SHEET_TABS.BACKUP_LOG]
    );

    const logRow = RowMapper.backupLog(entry);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${SHEET_TABS.BACKUP_LOG}'!A1`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [logRow],
      },
    });
  } catch (err) {
    if (isQuotaExceededError(err)) {
      incrementMetric('quota429Errors');
      console.warn(`[Google Sheets] Quota limit reached while recording Backup Log for ${entry.entity} (${entry.databaseId}). Skipped sheet log.`);
    } else {
      console.warn(`[Google Sheets] Failed to append to Backup Log: ${formatSheetsError(err)}`);
    }
  }
}

/**
 * Clears in-memory caches (useful for testing and reset triggers)
 */
export function clearSpreadsheetCache(spreadsheetId?: string): void {
  if (spreadsheetId) {
    sheetMetadataCache.delete(spreadsheetId);
    metadataPromises.delete(spreadsheetId);
    for (const key of rowIdCache.keys()) {
      if (key.startsWith(`${spreadsheetId}:`)) {
        rowIdCache.delete(key);
      }
    }
    for (const key of sheetCreationLocks.keys()) {
      if (key.startsWith(`${spreadsheetId}:`)) {
        sheetCreationLocks.delete(key);
      }
    }
  } else {
    sheetMetadataCache.clear();
    metadataPromises.clear();
    rowIdCache.clear();
    sheetCreationLocks.clear();
  }
}
