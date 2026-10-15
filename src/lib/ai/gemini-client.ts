import { GoogleGenAI } from '@google/genai';
import { db } from '@/db';
import { appSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

const SETTING_KEY = 'gemini_api_key';

/**
 * Retrieves the Gemini API key from environment variables or database app_settings.
 */
export async function getGeminiApiKey(): Promise<string | null> {
  // 1. Priority to environment variable
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
    return process.env.GEMINI_API_KEY.trim();
  }

  // 2. Fallback to database app_settings
  try {
    const [record] = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, SETTING_KEY))
      .limit(1);

    if (record?.value && record.value.trim() !== '') {
      return record.value.trim();
    }
  } catch (error) {
    console.error('Failed to query gemini_api_key from appSettings:', error);
  }

  return null;
}

/**
 * Persists a Gemini API key into the app_settings table.
 */
export async function saveGeminiApiKey(apiKey: string): Promise<boolean> {
  try {
    const cleanKey = apiKey.trim();
    const [existing] = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, SETTING_KEY))
      .limit(1);

    if (existing) {
      await db
        .update(appSettings)
        .set({ value: cleanKey, updatedAt: new Date() })
        .where(eq(appSettings.key, SETTING_KEY));
    } else {
      await db.insert(appSettings).values({
        key: SETTING_KEY,
        value: cleanKey,
      });
    }
    return true;
  } catch (error) {
    console.error('Failed to save gemini_api_key in appSettings:', error);
    return false;
  }
}

/**
 * Instantiates the GoogleGenAI client with the resolved key.
 */
export async function getGeminiClient(): Promise<GoogleGenAI> {
  const apiKey = await getGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      'Gemini API Key is not configured. Please add GEMINI_API_KEY to your .env.local file or set it in Dashboard Settings.'
    );
  }

  return new GoogleGenAI({ apiKey });
}
