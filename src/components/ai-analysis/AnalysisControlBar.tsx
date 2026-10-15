'use client';

import { Calendar, RefreshCw, Copy, Check, Filter, Clock, Loader2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface AnalysisControlBarProps {
  timeframe: string;
  onTimeframeChange: (t: string) => void;
  focusArea: string;
  onFocusAreaChange: (f: string) => void;
  onRunAnalysis: (forceRefresh: boolean) => Promise<void>;
  loading: boolean;
  cached: boolean;
  createdAt: string | null;
  summaryText?: string;
}

export default function AnalysisControlBar({
  timeframe,
  onTimeframeChange,
  focusArea,
  onFocusAreaChange,
  onRunAnalysis,
  loading,
  cached,
  createdAt,
  summaryText,
}: AnalysisControlBarProps) {
  const [copied, setCopied] = useState(false);

  function handleCopySummary() {
    if (!summaryText) return;
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    toast.success('Executive briefing copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="bg-card border border-border rounded-xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Left: Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border">
          <Calendar size={13} className="text-muted-foreground ml-1.5 shrink-0" />
          <button
            type="button"
            onClick={() => onTimeframeChange('30d')}
            disabled={loading}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              timeframe === '30d'
                ? 'bg-card text-foreground font-semibold shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Last 30 Days
          </button>
          <button
            type="button"
            onClick={() => onTimeframeChange('90d')}
            disabled={loading}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              timeframe === '90d'
                ? 'bg-card text-foreground font-semibold shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Last 90 Days
          </button>
          <button
            type="button"
            onClick={() => onTimeframeChange('ytd')}
            disabled={loading}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              timeframe === 'ytd'
                ? 'bg-card text-foreground font-semibold shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            YTD
          </button>
          <button
            type="button"
            onClick={() => onTimeframeChange('all')}
            disabled={loading}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              timeframe === 'all'
                ? 'bg-card text-foreground font-semibold shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Time
          </button>
        </div>

        {/* Focus Area Dropdown */}
        <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs">
          <Filter size={12} className="text-muted-foreground" />
          <select
            value={focusArea}
            onChange={(e) => onFocusAreaChange(e.target.value)}
            disabled={loading}
            className="bg-transparent text-white focus:outline-none cursor-pointer font-medium"
          >
            <option value="ALL" className="bg-neutral-900 text-white">Full Business Overview</option>
            <option value="SALES" className="bg-neutral-900 text-white">Sales &amp; AOV Focus</option>
            <option value="EXPENSES" className="bg-neutral-900 text-white">Expense &amp; Cost Reduction</option>
            <option value="MARKETING" className="bg-neutral-900 text-white">Meta Ads &amp; ROAS</option>
          </select>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        {formattedDate && (
          <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
            <Clock size={12} />
            <span>{cached ? 'Cached' : 'Generated'}: {formattedDate}</span>
          </div>
        )}

        {summaryText && (
          <button
            type="button"
            onClick={handleCopySummary}
            className="h-8 px-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            title="Copy Executive Summary"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy Brief'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onRunAnalysis(true)}
          disabled={loading}
          className="h-8 sm:h-9 px-3.5 bg-white hover:bg-neutral-200 text-black text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs shrink-0"
        >
          {loading ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              <span>Analyzing Ledger...</span>
            </>
          ) : (
            <>
              <RefreshCw size={13} />
              <span>Re-analyze</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
