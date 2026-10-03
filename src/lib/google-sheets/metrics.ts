import { GoogleSheetsMetrics } from './types';

const metrics: GoogleSheetsMetrics = {
  metadataCacheHits: 0,
  metadataCacheMisses: 0,
  sheetCreations: 0,
  quota429Errors: 0,
  retryCount: 0,
  successfulSyncs: 0,
  failedSyncs: 0,
};

export function getGoogleSheetsMetrics(): GoogleSheetsMetrics {
  return { ...metrics };
}

export function incrementMetric(key: keyof GoogleSheetsMetrics, count = 1): void {
  metrics[key] += count;
}

export function resetGoogleSheetsMetrics(): void {
  metrics.metadataCacheHits = 0;
  metrics.metadataCacheMisses = 0;
  metrics.sheetCreations = 0;
  metrics.quota429Errors = 0;
  metrics.retryCount = 0;
  metrics.successfulSyncs = 0;
  metrics.failedSyncs = 0;
}

/**
 * Formats API errors cleanly without leaking tokens or dumping hundreds of lines of Axios internals
 */
export function formatSheetsError(err: unknown): string {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;

  const anyErr = err as Record<string, unknown>;
  const status = anyErr.status || (anyErr.response as Record<string, unknown>)?.status || anyErr.code;
  const cause = anyErr.cause as Record<string, unknown> | undefined;
  const causeMessage =
    (cause && typeof cause.message === 'string' ? cause.message : undefined) ||
    (typeof anyErr.message === 'string' ? anyErr.message : undefined) ||
    (typeof anyErr.error === 'string' ? anyErr.error : undefined);

  const rawMsg = typeof anyErr.message === 'string' ? anyErr.message : (causeMessage || String(err));

  if (
    status === 429 ||
    status === 'RESOURCE_EXHAUSTED' ||
    rawMsg.includes('Quota exceeded') ||
    rawMsg.includes('RESOURCE_EXHAUSTED') ||
    rawMsg.includes('Too Many Requests')
  ) {
    return `429 Quota Exceeded: ${causeMessage || rawMsg}`;
  }

  if (status) {
    return `[HTTP ${status}] ${causeMessage || rawMsg}`;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return rawMsg;
}

export function isQuotaExceededError(err: unknown): boolean {
  if (!err) return false;
  const anyErr = err as Record<string, unknown>;
  const msg = err instanceof Error ? err.message : (typeof anyErr?.message === 'string' ? anyErr.message : String(err));
  const cause = anyErr?.cause as Record<string, unknown> | undefined;
  const causeMsg = cause && typeof cause.message === 'string' ? cause.message : '';
  const status = anyErr?.status || (anyErr?.response as Record<string, unknown>)?.status || anyErr?.code;
  const combined = `${msg} ${causeMsg}`;

  return (
    status === 429 ||
    status === 'RESOURCE_EXHAUSTED' ||
    combined.includes('Quota exceeded') ||
    combined.includes('RESOURCE_EXHAUSTED') ||
    combined.includes('Too Many Requests')
  );
}
