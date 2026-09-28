'use server';

import { db } from '@/db';
import { appSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function verifyRevenuePin(pin: string): Promise<boolean> {
  try {
    const setting = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, 'revenue_pin'))
      .limit(1);

    if (setting.length > 0) {
      return setting[0].value === pin;
    }
    return false;
  } catch (error) {
    console.error('Error verifying pin:', error);
    return false;
  }
}
