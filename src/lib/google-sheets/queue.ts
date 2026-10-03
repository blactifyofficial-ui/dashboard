import { db } from '@/db';
import { googleSheetsSyncQueue } from '@/db/schema';
import { eq, or, and, lte, isNull, asc, desc } from 'drizzle-orm';
import { syncRecordToGoogleSheets } from './sync';
import { SyncEntity, SyncOperation, SyncStatus } from './types';
import { incrementMetric, formatSheetsError, isQuotaExceededError } from './metrics';

interface EnqueueOptions {
  entity: SyncEntity;
  databaseId: string;
  operation?: SyncOperation;
  payload?: unknown;
}

// Configurable concurrency limit (default: 2 simultaneous Google Sheets operations)
const MAX_CONCURRENCY = Math.max(
  1,
  parseInt(process.env.GOOGLE_SHEETS_SYNC_CONCURRENCY || '2', 10)
);

// Worker state
let activeWorkers = 0;
let isQueueRunnerScheduled = false;
let rateLimitCooldownUntil = 0;

/**
 * Calculates exponential backoff delay with randomized jitter in milliseconds
 */
function getBackoffDelayWithJitter(attemptNumber: number, is429: boolean): number {
  const baseDelay = is429 ? 3000 : 1500;
  const maxDelay = is429 ? 60000 : 30000;
  const exponential = Math.min(maxDelay, Math.pow(2, attemptNumber) * baseDelay);
  const jitter = Math.random() * 1500;
  return Math.round(exponential + jitter);
}

/**
 * Schedules background queue processing if not already running
 */
export function scheduleQueueProcessing(): void {
  if (isQueueRunnerScheduled) return;
  isQueueRunnerScheduled = true;

  // Run on next tick
  setTimeout(() => {
    isQueueRunnerScheduled = false;
    void runQueueProcessor();
  }, 10);
}

/**
 * Controlled background queue processor that respects MAX_CONCURRENCY and 429 rate limit cooldowns
 */
async function runQueueProcessor(): Promise<void> {
  const now = Date.now();
  if (now < rateLimitCooldownUntil) {
    const remainingCooldown = rateLimitCooldownUntil - now;
    if (!isQueueRunnerScheduled) {
      isQueueRunnerScheduled = true;
      setTimeout(() => {
        isQueueRunnerScheduled = false;
        void runQueueProcessor();
      }, remainingCooldown + 50);
    }
    return;
  }

  while (activeWorkers < MAX_CONCURRENCY) {
    const slotsAvailable = MAX_CONCURRENCY - activeWorkers;
    if (slotsAvailable <= 0) break;

    try {
      const pendingJobs = await db
        .select()
        .from(googleSheetsSyncQueue)
        .where(
          and(
            eq(googleSheetsSyncQueue.status, 'PENDING'),
            or(
              isNull(googleSheetsSyncQueue.nextRetryAt),
              lte(googleSheetsSyncQueue.nextRetryAt, new Date())
            )
          )
        )
        .orderBy(asc(googleSheetsSyncQueue.createdAt))
        .limit(slotsAvailable);

      if (pendingJobs.length === 0) {
        break;
      }

      for (const job of pendingJobs) {
        if (activeWorkers >= MAX_CONCURRENCY) break;
        activeWorkers++;

        void (async () => {
          try {
            await processSyncJob(job.id);
          } finally {
            activeWorkers = Math.max(0, activeWorkers - 1);
            scheduleQueueProcessing();
          }
        })();
      }
    } catch (err) {
      console.error('[Google Sheets] Error polling sync queue:', formatSheetsError(err));
      break;
    }
  }
}

/**
 * Enqueues a sync job in the database outbox and notifies the concurrency-controlled runner.
 * Guarantees DB mutations are never disrupted.
 */
export async function enqueueSyncJob(options: EnqueueOptions): Promise<string> {
  const { entity, databaseId, operation = 'UPDATE', payload } = options;
  const jobId = crypto.randomUUID();

  try {
    const payloadStr = payload ? JSON.stringify(payload) : null;

    // Check if an active pending/syncing job already exists for this entity + databaseId
    const existing = await db
      .select()
      .from(googleSheetsSyncQueue)
      .where(
        and(
          eq(googleSheetsSyncQueue.entity, entity),
          eq(googleSheetsSyncQueue.databaseId, databaseId),
          or(
            eq(googleSheetsSyncQueue.status, 'PENDING'),
            eq(googleSheetsSyncQueue.status, 'SYNCING')
          )
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing job with latest payload & mark pending
      await db
        .update(googleSheetsSyncQueue)
        .set({
          operation,
          payload: payloadStr,
          status: 'PENDING',
          updatedAt: new Date(),
        })
        .where(eq(googleSheetsSyncQueue.id, existing[0].id));

      scheduleQueueProcessing();
      return existing[0].id;
    }

    // Insert new sync job
    await db.insert(googleSheetsSyncQueue).values({
      id: jobId,
      entity,
      databaseId,
      operation,
      payload: payloadStr,
      status: 'PENDING',
      attempts: '0',
      maxAttempts: '5',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    scheduleQueueProcessing();
    return jobId;
  } catch (err) {
    console.error(`[Google Sheets] Failed to enqueue sync job for ${entity} (${databaseId}):`, formatSheetsError(err));
    return jobId;
  }
}

/**
 * Processes a single sync job with controlled error handling and exponential backoff retry logic
 */
export async function processSyncJob(jobId: string): Promise<boolean> {
  try {
    const [job] = await db
      .select()
      .from(googleSheetsSyncQueue)
      .where(eq(googleSheetsSyncQueue.id, jobId))
      .limit(1);

    if (!job || job.status === 'SUCCESS') {
      return true;
    }

    const currentAttempts = Number(job.attempts || 0);
    const maxAttempts = Number(job.maxAttempts || 5);

    // Mark as SYNCING
    await db
      .update(googleSheetsSyncQueue)
      .set({
        status: 'SYNCING',
        lastAttemptAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(googleSheetsSyncQueue.id, jobId));

    // Attempt synchronization
    const result = await syncRecordToGoogleSheets(
      job.entity as SyncEntity,
      job.databaseId,
      job.operation as SyncOperation
    );

    if (result.success) {
      await db
        .update(googleSheetsSyncQueue)
        .set({
          status: 'SUCCESS',
          errorMessage: null,
          attempts: String(currentAttempts + 1),
          updatedAt: new Date(),
        })
        .where(eq(googleSheetsSyncQueue.id, jobId));

      incrementMetric('successfulSyncs');
      return true;
    } else {
      const is429 = isQuotaExceededError(result.error);
      const newAttempts = currentAttempts + 1;
      const delayMs = getBackoffDelayWithJitter(newAttempts, is429);
      const nextRetryAt = new Date(Date.now() + delayMs);
      const finalStatus: SyncStatus = newAttempts >= maxAttempts ? 'FAILED' : 'PENDING';

      if (is429) {
        rateLimitCooldownUntil = Math.max(rateLimitCooldownUntil, Date.now() + delayMs);
        incrementMetric('quota429Errors');
        incrementMetric('retryCount');
        console.warn(
          `[Google Sheets] 429 Quota limit hit for ${job.entity} (${job.databaseId}). Cooldown for ${Math.round(delayMs)}ms (attempt ${newAttempts}/${maxAttempts}).`
        );
      } else {
        incrementMetric('failedSyncs');
      }

      await db
        .update(googleSheetsSyncQueue)
        .set({
          status: finalStatus,
          attempts: String(newAttempts),
          errorMessage: result.error || 'Failed to sync record',
          nextRetryAt,
          updatedAt: new Date(),
        })
        .where(eq(googleSheetsSyncQueue.id, jobId));

      return false;
    }
  } catch (err: unknown) {
    const errorMsg = formatSheetsError(err);
    console.error(`[Google Sheets] Error processing sync job ${jobId}:`, errorMsg);
    incrementMetric('failedSyncs');

    try {
      await db
        .update(googleSheetsSyncQueue)
        .set({
          status: 'FAILED',
          errorMessage: errorMsg,
          updatedAt: new Date(),
        })
        .where(eq(googleSheetsSyncQueue.id, jobId));
    } catch {
      // Ignore secondary error
    }
    return false;
  }
}

/**
 * Retries all failed and pending jobs in the queue
 */
export async function retryFailedSyncJobs(): Promise<{
  totalRetried: number;
  succeeded: number;
  failed: number;
}> {
  const failedJobs = await db
    .select()
    .from(googleSheetsSyncQueue)
    .where(
      or(
        eq(googleSheetsSyncQueue.status, 'FAILED'),
        eq(googleSheetsSyncQueue.status, 'PENDING')
      )
    )
    .orderBy(desc(googleSheetsSyncQueue.updatedAt))
    .limit(100);

  let succeeded = 0;
  let failed = 0;

  for (const job of failedJobs) {
    await db
      .update(googleSheetsSyncQueue)
      .set({
        status: 'PENDING',
        attempts: '0',
        nextRetryAt: null,
        updatedAt: new Date(),
      })
      .where(eq(googleSheetsSyncQueue.id, job.id));

    const ok = await processSyncJob(job.id);
    if (ok) {
      succeeded++;
    } else {
      failed++;
    }
  }

  scheduleQueueProcessing();

  return {
    totalRetried: failedJobs.length,
    succeeded,
    failed,
  };
}
