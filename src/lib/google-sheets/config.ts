import { GoogleSheetsCredentials } from './types';

const DEFAULT_SPREADSHEET_ID = '1oGI2f-NQi54HKQowazhRCdn9y1qAXWHqW6e15FM7w_0';

/**
 * Extracts spreadsheet ID from full Google Spreadsheet URL if provided
 */
export function extractSpreadsheetId(urlOrId?: string | null): string {
  if (!urlOrId) return DEFAULT_SPREADSHEET_ID;
  const match = urlOrId.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return urlOrId.trim();
}

/**
 * Normalizes private key formatting (handles escaped \n newlines)
 */
export function formatPrivateKey(rawKey?: string | null): string | undefined {
  if (!rawKey) return undefined;
  let key = rawKey.trim();
  // Remove wrapping quotes if present
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, '\n');
}

/**
 * Retrieves Google Sheets service configuration from server-side environment variables
 */
export function getGoogleSheetsConfig(): GoogleSheetsCredentials {
  const rawSpreadsheetId =
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID ||
    process.env.GOOGLE_SHEET_ID ||
    process.env.GOOGLE_SHEET_LINK ||
    DEFAULT_SPREADSHEET_ID;

  const spreadsheetId = extractSpreadsheetId(rawSpreadsheetId);

  let clientEmail = (
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
    process.env.GOOGLE_CLIENT_EMAIL ||
    process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL ||
    ''
  ).trim();

  let rawPrivateKey =
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
    process.env.GOOGLE_PRIVATE_KEY ||
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY ||
    '';

  // Support JSON credentials string if provided in env
  const jsonCreds =
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ||
    process.env.GOOGLE_CREDENTIALS;

  if (jsonCreds && (!clientEmail || !rawPrivateKey)) {
    try {
      const parsed = typeof jsonCreds === 'string' ? JSON.parse(jsonCreds) : jsonCreds;
      if (parsed.client_email && !clientEmail) {
        clientEmail = parsed.client_email;
      }
      if (parsed.private_key && !rawPrivateKey) {
        rawPrivateKey = parsed.private_key;
      }
    } catch {
      // ignore JSON parse errors
    }
  }

  const privateKey = formatPrivateKey(rawPrivateKey);

  const isConfigured = Boolean(
    spreadsheetId &&
    clientEmail &&
    clientEmail.includes('@') &&
    privateKey &&
    privateKey.includes('PRIVATE KEY')
  );

  return {
    spreadsheetId,
    clientEmail: clientEmail || undefined,
    privateKey,
    isConfigured,
  };
}
