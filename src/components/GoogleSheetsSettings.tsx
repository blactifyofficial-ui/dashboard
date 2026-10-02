'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ExternalLink, 
  AlertCircle,
  Database,
  RotateCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { FullSyncStats, FullSyncEntityStats } from '@/lib/google-sheets/types';

interface ConnectionStatus {
  connected: boolean;
  spreadsheetId: string;
  spreadsheetTitle?: string;
  sheetNames?: string[];
  lastSuccessfulSync?: string | null;
  pendingSyncsCount: number;
  failedSyncsCount: number;
  error?: string | null;
}

export default function GoogleSheetsSettings() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastSyncReport, setLastSyncReport] = useState<FullSyncStats | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/google-sheets/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        setStatus({
          connected: false,
          spreadsheetId: '1oGI2f-NQi54HKQowazhRCdn9y1qAXWHqW6e15FM7w_0',
          pendingSyncsCount: 0,
          failedSyncsCount: 0,
          error: errData.error || 'Failed to fetch status',
        });
      }
    } catch (err: unknown) {
      console.error('Error fetching Google Sheets status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch('/api/google-sheets/status');
        if (!ignore && res.ok) {
          const data = await res.json();
          setStatus(data);
        } else if (!ignore) {
          const errData = await res.json().catch(() => ({}));
          setStatus({
            connected: false,
            spreadsheetId: '1oGI2f-NQi54HKQowazhRCdn9y1qAXWHqW6e15FM7w_0',
            pendingSyncsCount: 0,
            failedSyncsCount: 0,
            error: errData.error || 'Failed to fetch status',
          });
        }
      } catch (err: unknown) {
        if (!ignore) console.error('Error fetching Google Sheets status:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleTestConnection = async () => {
    try {
      setIsTesting(true);
      const res = await fetch('/api/google-sheets/test-connection', { method: 'POST' });
      const data = await res.json();
      setStatus(data);
      if (data.connected) {
        toast.success(`Connected to "${data.spreadsheetTitle || 'Google Spreadsheet'}"!`);
      } else {
        toast.error(data.error || 'Google Sheets connection failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error testing connection';
      toast.error(msg);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncAll = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/google-sheets/sync-all', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setLastSyncReport(data as FullSyncStats);
        toast.success(`Synced ${data.totalRecords} records across all tabs!`);
        await fetchStatus();
      } else {
        toast.error(data.error || 'Full sync failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error triggering full sync';
      toast.error(msg);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRetryFailed = async () => {
    try {
      setIsRetrying(true);
      const res = await fetch('/api/google-sheets/retry-failed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(`Retried ${data.totalRetried} jobs (${data.succeeded} succeeded, ${data.failed} failed)`);
        await fetchStatus();
      } else {
        toast.error(data.error || 'Failed to retry sync queue');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error retrying sync queue';
      toast.error(msg);
    } finally {
      setIsRetrying(false);
    }
  };

  const spreadsheetId = status?.spreadsheetId || '1oGI2f-NQi54HKQowazhRCdn9y1qAXWHqW6e15FM7w_0';
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return 'Never';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? 'Never' : d.toLocaleString();
    } catch {
      return 'Never';
    }
  };

  return (
    <div className="bg-[#1e1e1e] p-4 sm:p-6 rounded-xl border border-white/10 shadow-sm text-white space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-medium text-white">Google Sheets Backup & Mirror</h2>
            <p className="text-xs text-gray-400">Automatic real-time synchronization from PostgreSQL</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loading ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-400 border border-gray-700">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Checking...
            </span>
          ) : status?.connected ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <XCircle className="w-3.5 h-3.5" /> Not Connected
            </span>
          )}
        </div>
      </div>

      {/* Connection & Configuration Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/[0.03] p-3.5 rounded-lg border border-white/5 space-y-1">
          <span className="text-xs text-gray-400 font-medium">Spreadsheet Destination</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-gray-200 truncate" title={spreadsheetId}>
              {spreadsheetId.slice(0, 12)}...
            </span>
            <a 
              href={spreadsheetUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 transition-colors p-1"
              title="Open Google Spreadsheet in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="bg-white/[0.03] p-3.5 rounded-lg border border-white/5 space-y-1">
          <span className="text-xs text-gray-400 font-medium">Last Successful Sync</span>
          <p className="text-sm font-medium text-gray-200">
            {formatDateTime(status?.lastSuccessfulSync)}
          </p>
        </div>

        <div className="bg-white/[0.03] p-3.5 rounded-lg border border-white/5 space-y-1">
          <span className="text-xs text-gray-400 font-medium">Pending Sync Jobs</span>
          <p className="text-sm font-semibold text-amber-400">
            {status?.pendingSyncsCount ?? 0}
          </p>
        </div>

        <div className="bg-white/[0.03] p-3.5 rounded-lg border border-white/5 space-y-1">
          <span className="text-xs text-gray-400 font-medium">Failed Sync Jobs</span>
          <p className={`text-sm font-semibold ${(status?.failedSyncsCount ?? 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {status?.failedSyncsCount ?? 0}
          </p>
        </div>
      </div>

      {status?.error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-3 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-rose-200">Connection Error / Notice</p>
            <p className="mt-0.5 text-rose-300/90">{status.error}</p>
          </div>
        </div>
      )}

      {/* Tabs Synchronized List */}
      {status?.sheetNames && status.sheetNames.length > 0 && (
        <div className="bg-white/[0.02] p-3.5 rounded-lg border border-white/5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-300">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Detected Sheets in Spreadsheet:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {status.sheetNames.map((name) => (
              <span key={name} className="px-2 py-0.5 text-[11px] bg-white/5 rounded border border-white/10 text-gray-300 font-mono">
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Last Sync Stats */}
      {lastSyncReport && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-2 text-xs text-emerald-300">
          <p className="font-semibold text-emerald-200">
            Full Sync Completed ({lastSyncReport.totalRecords} records in {(lastSyncReport.durationMs / 1000).toFixed(1)}s)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {lastSyncReport.entities?.map((ent: FullSyncEntityStats) => (
              <div key={ent.entity} className="bg-black/20 p-2 rounded">
                <span className="text-gray-400 block truncate">{ent.tabName}</span>
                <span className="font-medium text-white">{ent.count} rows</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          onClick={handleTestConnection}
          disabled={isTesting}
          className="h-10 px-4 text-xs sm:text-sm font-medium bg-white/10 hover:bg-white/15 text-white rounded-lg border border-white/15 transition-all inline-flex items-center gap-2 disabled:opacity-50"
        >
          {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Test Connection
        </button>

        <button
          onClick={handleSyncAll}
          disabled={isSyncing}
          className="h-10 px-5 text-xs sm:text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm transition-all inline-flex items-center gap-2 disabled:opacity-50"
        >
          {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
          Sync Everything
        </button>

        {(status?.failedSyncsCount ?? 0) > 0 && (
          <button
            onClick={handleRetryFailed}
            disabled={isRetrying}
            className="h-10 px-4 text-xs sm:text-sm font-medium bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg transition-all inline-flex items-center gap-2 disabled:opacity-50"
          >
            {isRetrying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Retry Failed Syncs ({status?.failedSyncsCount})
          </button>
        )}
      </div>

      <p className="text-[11px] text-gray-500">
        PostgreSQL is the single source of truth. All database mutations automatically queue background backup syncs to Google Sheets without interrupting normal user operations.
      </p>
    </div>
  );
}
