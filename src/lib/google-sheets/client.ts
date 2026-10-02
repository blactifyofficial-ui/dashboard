import { google, sheets_v4 } from 'googleapis';
import { getGoogleSheetsConfig } from './config';
import { ConnectionStatusResult } from './types';
import { db } from '@/db';
import { googleSheetsSyncQueue } from '@/db/schema';
import { desc } from 'drizzle-orm';

/**
 * Creates and returns an authenticated Google Sheets API client
 */
export async function getGoogleSheetsClient(): Promise<{
  sheets: sheets_v4.Sheets;
  spreadsheetId: string;
}> {
  const config = getGoogleSheetsConfig();

  if (!config.isConfigured || !config.clientEmail || !config.privateKey) {
    throw new Error(
      'Google Sheets service account is not fully configured. Please provide GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.'
    );
  }

  const auth = new google.auth.JWT({
    email: config.clientEmail,
    key: config.privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return { sheets, spreadsheetId: config.spreadsheetId };
}

/**
 * Tests connection to Google Sheets spreadsheet and returns status metadata
 */
export async function testGoogleSheetsConnection(): Promise<ConnectionStatusResult> {
  const config = getGoogleSheetsConfig();

  // Fetch pending and failed count from database
  let pendingSyncsCount = 0;
  let failedSyncsCount = 0;
  let lastSuccessfulSync: string | null = null;

  try {
    const queueRecords = await db
      .select()
      .from(googleSheetsSyncQueue)
      .orderBy(desc(googleSheetsSyncQueue.updatedAt))
      .limit(100);

    pendingSyncsCount = queueRecords.filter((r) => r.status === 'PENDING' || r.status === 'SYNCING').length;
    failedSyncsCount = queueRecords.filter((r) => r.status === 'FAILED').length;
    
    const lastSuccess = queueRecords.find((r) => r.status === 'SUCCESS');
    if (lastSuccess) {
      lastSuccessfulSync = new Date(lastSuccess.updatedAt).toISOString();
    }
  } catch (err) {
    console.error('Error querying sync queue stats:', err);
  }

  if (!config.isConfigured || !config.clientEmail || !config.privateKey) {
    return {
      connected: false,
      spreadsheetId: config.spreadsheetId,
      pendingSyncsCount,
      failedSyncsCount,
      lastSuccessfulSync,
      error: 'Google Service Account credentials missing or incomplete (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY).',
    };
  }

  try {
    const { sheets, spreadsheetId } = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'properties.title,sheets.properties.title',
    });

    const spreadsheetTitle = response.data.properties?.title || 'Google Sheet';
    const sheetNames = (response.data.sheets || [])
      .map((s) => s.properties?.title)
      .filter((t): t is string => Boolean(t));

    // Test write permission
    let writePermissionWarning: string | null = null;
    try {
      const firstSheet = sheetNames[0] || 'Sheet1';
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${firstSheet}!Z1000`,
        valueInputOption: 'RAW',
        requestBody: { values: [] },
      });
    } catch (writeErr: unknown) {
      const msg = writeErr instanceof Error ? writeErr.message : String(writeErr);
      if (msg.includes('The caller does not have permission') || msg.includes('PERMISSION_DENIED')) {
        writePermissionWarning = `Service account (${config.clientEmail}) has Read-only / Viewer access. Please share the Google Spreadsheet with "${config.clientEmail}" with "Editor" permission.`;
      }
    }

    return {
      connected: true,
      spreadsheetId,
      spreadsheetTitle,
      sheetNames,
      lastSuccessfulSync,
      pendingSyncsCount,
      failedSyncsCount,
      error: writePermissionWarning,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to authenticate with Google Sheets API.';
    console.error('Google Sheets connection error:', err);
    return {
      connected: false,
      spreadsheetId: config.spreadsheetId,
      pendingSyncsCount,
      failedSyncsCount,
      lastSuccessfulSync,
      error: errorMessage,
    };
  }
}
