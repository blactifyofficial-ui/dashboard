'use client';

import { useState } from 'react';
import { BrainCircuit, AlertCircle, ArrowUpRight, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { AiStrategicReport } from '@/lib/ai/prompts';
import { FinancialSnapshot } from '@/lib/ai/financial-aggregator';
import AnalysisControlBar from './AnalysisControlBar';
import HealthScoreCard from './HealthScoreCard';
import StrategicRoadmap from './StrategicRoadmap';
import DeepDiveTabs from './DeepDiveTabs';
import AiConsultantChat from './AiConsultantChat';

interface AiAnalysisDashboardProps {
  initialReport: AiStrategicReport | null;
  initialSnapshot: FinancialSnapshot;
  initialCreatedAt: string | null;
  initialCached: boolean;
  canGenerate: boolean;
}

export default function AiAnalysisDashboard({
  initialReport,
  initialSnapshot,
  initialCreatedAt,
  initialCached,
  canGenerate,
}: AiAnalysisDashboardProps) {
  const [report, setReport] = useState<AiStrategicReport | null>(initialReport);
  const [snapshot, setSnapshot] = useState<FinancialSnapshot>(initialSnapshot);
  const [createdAt, setCreatedAt] = useState<string | null>(initialCreatedAt);
  const [cached, setCached] = useState<boolean>(initialCached);
  const [timeframe, setTimeframe] = useState<string>(initialSnapshot.timeframe || '30d');
  const [focusArea, setFocusArea] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(false);
  const [keyMissingError, setKeyMissingError] = useState<boolean>(false);

  async function runAnalysis(forceRefresh: boolean = false, targetTimeframe?: string, targetFocus?: string) {
    const tf = targetTimeframe || timeframe;
    const fa = targetFocus || focusArea;

    setLoading(true);
    setKeyMissingError(false);

    try {
      const res = await fetch('/api/ai-analysis/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeframe: tf,
          focusArea: fa,
          forceRefresh,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'GEMINI_KEY_MISSING') {
          setKeyMissingError(true);
          toast.error('Gemini API key is required. Configure it in Settings.');
          return;
        }
        throw new Error(data.error || 'Failed to generate strategic analysis');
      }

      setReport(data.report);
      setSnapshot(data.snapshot);
      setCreatedAt(data.createdAt || new Date().toISOString());
      setCached(Boolean(data.cached));

      if (data.cached) {
        toast.success('Loaded recent cached analysis for this period');
      } else {
        toast.success('Strategic analysis generated successfully!');
      }
    } catch (err: any) {
      console.error('Run analysis error:', err);
      toast.error(err.message || 'Error running analysis');
    } finally {
      setLoading(false);
    }
  }

  async function handleTimeframeChange(newTimeframe: string) {
    setTimeframe(newTimeframe);
    // Fetch latest for this timeframe
    setLoading(true);
    try {
      const res = await fetch(`/api/ai-analysis/latest?timeframe=${newTimeframe}&focusArea=${focusArea}`);
      const data = await res.json();
      if (res.ok && data.hasReport) {
        setReport(data.report);
        setSnapshot(data.snapshot);
        setCreatedAt(data.createdAt);
        setCached(true);
      } else if (res.ok && data.snapshot) {
        setSnapshot(data.snapshot);
        // Prompt user or automatically run if none exists
        setReport(null);
        setCreatedAt(null);
      }
    } catch (err) {
      console.error('Failed to change timeframe:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFocusAreaChange(newFocus: string) {
    setFocusArea(newFocus);
    // Fetch latest for this focus
    setLoading(true);
    try {
      const res = await fetch(`/api/ai-analysis/latest?timeframe=${timeframe}&focusArea=${newFocus}`);
      const data = await res.json();
      if (res.ok && data.hasReport) {
        setReport(data.report);
        setSnapshot(data.snapshot);
        setCreatedAt(data.createdAt);
        setCached(true);
      } else if (res.ok && data.snapshot) {
        setSnapshot(data.snapshot);
        setReport(null);
        setCreatedAt(null);
      }
    } catch (err) {
      console.error('Failed to change focus:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 relative z-10 pb-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>AI Strategic Financial Command Center</span>
            </h1>
            <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Gemini 2.5 Flash
            </span>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Autonomous CFO &amp; Growth Strategist evaluating sales, operational burn, ad spend ROI, and tactical priorities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-card border border-border hover:bg-muted text-foreground transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>Gemini Settings</span>
            <ArrowUpRight size={13} className="text-muted-foreground" />
          </Link>
        </div>
      </header>

      {/* API Key Missing Notice */}
      {keyMissingError && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={16} className="text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold block text-amber-200">Gemini API Key Required</span>
              <span>Please configure your Google Gemini API key in Dashboard Settings to activate autonomous AI analysis.</span>
            </div>
          </div>
          <Link
            href="/settings"
            className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition-colors shrink-0 flex items-center justify-center"
          >
            Go to Settings
          </Link>
        </div>
      )}

      {/* Control Bar */}
      <AnalysisControlBar
        timeframe={timeframe}
        onTimeframeChange={handleTimeframeChange}
        focusArea={focusArea}
        onFocusAreaChange={handleFocusAreaChange}
        onRunAnalysis={runAnalysis}
        loading={loading}
        cached={cached}
        createdAt={createdAt}
        summaryText={report?.summary}
      />

      {/* Main Content Area */}
      {loading && !report ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-3">
          <Loader2 size={32} className="animate-spin text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Synthesizing Verified Store Ledger...</h3>
          <p className="text-xs text-muted-foreground max-w-md">
            Aggregating orders, COGS, operational expenses, Meta Ads ROAS, and recurring overhead to formulate strategic roadmap.
          </p>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* 1. Health Score & Executive Summary */}
          <HealthScoreCard report={report} snapshot={snapshot} />

          {/* 2. Actionable Strategic Roadmap ("Strategy to Follow") */}
          <StrategicRoadmap roadmap={report.strategicRoadmap} />

          {/* 3. Operational Deep-Dive Audits */}
          <DeepDiveTabs deepDives={report.deepDives} />

          {/* 4. Interactive "Ask AI Advisor" Consultant */}
          <AiConsultantChat timeframe={timeframe} summary={report.summary} />
        </div>
      ) : (
        /* Empty State / First Run */
        <div className="bg-card border border-border rounded-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-foreground">
            <BrainCircuit size={24} />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-base font-semibold text-foreground">
              No Analysis Generated Yet for this Window
            </h3>
            <p className="text-xs text-muted-foreground">
              Click &quot;Run AI Analysis&quot; to ingest ₹{snapshot.sales.totalRevenue.toLocaleString('en-IN')} in revenue, {snapshot.sales.totalOrders} orders, and ₹{snapshot.expenses.totalOperationalExpenses.toLocaleString('en-IN')} in operational expenses into Gemini.
            </p>
          </div>

          <button
            type="button"
            onClick={() => runAnalysis(true)}
            disabled={loading || !canGenerate}
            className="h-9 px-5 bg-white hover:bg-neutral-200 text-black text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-xs"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <BrainCircuit size={15} />}
            <span>Generate Strategic Audit</span>
          </button>
        </div>
      )}
    </div>
  );
}
