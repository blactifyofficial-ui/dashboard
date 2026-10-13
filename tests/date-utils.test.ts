import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  getStoreDateParts, 
  getStoreDay, 
  getStoreMonthRange, 
  getStoreNow, 
  formatStoreDate, 
  formatStoreTime 
} from '../src/lib/date-utils';

describe('Store Timezone & Date Utils (Asia/Kolkata 24h day)', () => {
  it('should correctly extract calendar day in Asia/Kolkata for early morning order', () => {
    // 01:43:03 AM IST on Oct 13, 2026 is 2026-10-12T20:13:03.000Z in UTC
    const utcDate = new Date('2026-10-12T20:13:03.000Z');
    const parts = getStoreDateParts(utcDate);
    assert.strictEqual(parts.year, 2026);
    assert.strictEqual(parts.month, 10);
    assert.strictEqual(parts.day, 13);
    assert.strictEqual(parts.dateStr, '2026-10-13');
    assert.strictEqual(getStoreDay(utcDate), 13);
  });

  it('should correctly extract calendar day in Asia/Kolkata for late night order', () => {
    // 11:09:38 PM IST on Oct 12, 2026 is 2026-10-12T17:39:38.000Z in UTC
    const utcDate = new Date('2026-10-12T17:39:38.000Z');
    const parts = getStoreDateParts(utcDate);
    assert.strictEqual(parts.year, 2026);
    assert.strictEqual(parts.month, 10);
    assert.strictEqual(parts.day, 12);
    assert.strictEqual(getStoreDay(utcDate), 12);
  });

  it('should compute exact UTC month boundaries for October 2026 in Asia/Kolkata', () => {
    const { startDate, endDate } = getStoreMonthRange(2026, 10);
    // 2026-10-01 00:00:00+05:30 -> 2026-09-30T18:30:00.000Z
    assert.strictEqual(startDate.toISOString(), '2026-09-30T18:30:00.000Z');
    // 2026-11-01 00:00:00+05:30 -> 2026-10-31T18:30:00.000Z
    assert.strictEqual(endDate.toISOString(), '2026-10-31T18:30:00.000Z');
  });

  it('should handle year wrap-around for December', () => {
    const { startDate, endDate } = getStoreMonthRange(2026, 12);
    // 2026-12-01 00:00:00+05:30 -> 2026-11-30T18:30:00.000Z
    assert.strictEqual(startDate.toISOString(), '2026-11-30T18:30:00.000Z');
    // 2027-01-01 00:00:00+05:30 -> 2026-12-31T18:30:00.000Z
    assert.strictEqual(endDate.toISOString(), '2026-12-31T18:30:00.000Z');
  });

  it('should format store date and time consistently', () => {
    const utcDate = new Date('2026-10-13T08:33:55.000Z'); // 2:03:55 PM IST
    const dateFormatted = formatStoreDate(utcDate);
    assert.strictEqual(dateFormatted, 'Oct 13, 2026');
    const timeFormatted = formatStoreTime(utcDate);
    assert.match(timeFormatted, /02:03\s*PM/i);
  });

  it('should return current store date parts with getStoreNow', () => {
    const now = getStoreNow();
    assert.ok(now.year >= 2026);
    assert.ok(now.month >= 1 && now.month <= 12);
    assert.ok(now.day >= 1 && now.day <= 31);
    assert.match(now.dateStr, /^\d{4}-\d{2}-\d{2}$/);
  });
});
