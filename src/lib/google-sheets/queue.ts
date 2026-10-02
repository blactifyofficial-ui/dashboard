import { db } from '@/db';
import { googleSheetsSyncQueue } from '@/db/schema';
import { eq, or, and, desc } from 'drizzle-orm';
import { syncRecordToGoogleSheets } from './sync';
import { SyncEntity, SyncOperation, SyncStatus } from './types';

interface EnqueueOptions {
  entity: SyncEntity;
  databaseId: string;
  operation?: SyncOperation;
  payload?: unknown;
}

/**
 * Calculates exponential backoff delay in milliseconds
 * 1st attempt: 2s, 2nd attempt: 5s, 3rd attempt: 15s, 4th attempt: 60s, 5th+: 300s
 */
function getBackoffDelayMs(attemptNumber: number): number {
  switch (attemptNumber) {
    case 1:
      return 2000;
    case 2:
      return 5000;
    case 3:
      return 15000;
    case 4:
      return 60000;
    default:
      return 300000;
  }
}

/**
 * Enqueues a sync job in the database outbox and triggers background execution
 * Never throws or fails the caller - guarantees DB mutations are not disrupted.
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
      // Update existing pending job with latest operation and payload
      await db
        .update(googleSheetsSyncQueue)
        .set({
          operation,
          payload: payloadStr,
          status: 'PENDING',
          updatedAt: new Date(),
        })
        .where(eq(googleSheetsSyncQueue.id, existing[0].id));

      // Trigger background attempt
      void processSyncJob(existing[0].id).catch((e) =>
        console.error(`Background sync error for job ${existing[0].id}:`, e)
      );
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

    // Execute asynchronously in background without blocking current request
    void processSyncJob(jobId).catch((e) =>
      console.error(`Background sync error for job ${jobId}:`, e)
    );

    return jobId;
  } catch (err) {
    console.error(`Failed to enqueue sync job for ${entity} (${databaseId}):`, err);
    return jobId;
  }
}

/**
 * Processes a single sync job with error handling and exponential backoff retry logic
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

    // Attempt the synchronization
    const result = await syncRecordToGoogleSheets(
      job.entity as SyncEntity,
      job.databaseId,
      job.operation as SyncOperation
    );

    if (result.success) {
      // Update as SUCCESS
      await db
        .update(googleSheetsSyncQueue)
        .set({
          status: 'SUCCESS',
          errorMessage: null,
          attempts: String(currentAttempts + 1),
          updatedAt: new Date(),
        })
        .where(eq(googleSheetsSyncQueue.id, jobId));
      return true;
    } else {
      // Sync failed
      const newAttempts = currentAttempts + 1;
      const delayMs = getBackoffDelayMs(newAttempts);
      const nextRetryAt = new Date(Date.now() + delayMs);
      const finalStatus: SyncStatus = newAttempts >= maxAttempts ? 'FAILED' : 'PENDING';

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
    const errorMsg = err instanceof Error ? err.message : 'Execution error during sync';
    console.error(`Error in processSyncJob for ${jobId}:`, err);
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
      // Ignore secondary update error
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
    // Reset attempts if it was completely failed
    await db
      .update(googleSheetsSyncQueue)
      .set({
        status: 'PENDING',
        attempts: '0',
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

  return {
    totalRetried: failedJobs.length,
    succeeded,
    failed,
  };
}
