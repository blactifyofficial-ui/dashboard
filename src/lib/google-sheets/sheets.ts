import { sheets_v4 } from 'googleapis';
import { SHEET_TABS, SHEET_HEADERS, RowMapper } from './row-mapper';
import { BackupLogEntry } from './types';

/**
 * Ensures that the given sheet tab exists in the spreadsheet with appropriate headers.
 * Safe to call repeatedly: will not overwrite existing rows or duplicate tabs.
 */
export async function ensureSheetWithHeaders(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetName: string,
  headers: string[]
): Promise<void> {
  // 1. Get spreadsheet metadata to check existing tabs
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties',
  });

  const existingSheets = meta.data.sheets || [];
  const foundSheet = existingSheets.find((s) => s.properties?.title === sheetName);

  if (!foundSheet) {
    // Tab doesn't exist, create it and set header row
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

    const newSheetId = addSheetResponse.data.replies?.[0]?.addSheet?.properties?.sheetId;

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
        // Styling is non-critical, proceed if formatting fails
        console.warn(`Could not format header style for sheet "${sheetName}":`, styleErr);
      }
    }
  } else {
    // Tab already exists, verify headers in row 1
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!A1:Z1`,
    });

    const existingHeaderRow = res.data.values?.[0] || [];
    if (existingHeaderRow.length === 0) {
      // Row 1 is empty, write headers
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${sheetName}'!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [headers],
        },
      });
    }
  }
}

/**
 * Reads column A of a sheet tab and returns a Map of Database ID -> 1-based Row Number
 */
export async function getSheetRowIds(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetName: string
): Promise<Map<string, number>> {
  const rowIdMap = new Map<string, number>();

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!A2:A`,
    });

    const rows = res.data.values || [];
    for (let i = 0; i < rows.length; i++) {
      const idVal = rows[i]?.[0];
      if (idVal !== undefined && idVal !== null && String(idVal).trim().length > 0) {
        const id = String(idVal).trim();
        // Row 2 is index 0, so row number is i + 2
        rowIdMap.set(id, i + 2);
      }
    }
  } catch (err) {
    console.warn(`Could not read row IDs for sheet "${sheetName}":`, err);
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
 * Appends new rows to a sheet tab
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

  // Google Sheets API recommends chunking batch updates (e.g. 100 per batch)
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
 * Appends a log entry to the 'Backup Log' sheet tab
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
    // Log recording failure should not throw to caller
    console.error('Failed to append to Backup Log sheet:', err);
  }
}
