'use client';

import { useState } from 'react';
import { ShoppingBag, Wallet, Megaphone, DollarSign, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';
import { AiStrategicReport } from '@/lib/ai/prompts';

interface DeepDiveTabsProps {
  deepDives: AiStrategicReport['deepDives'];
}

export default function DeepDiveTabs({ deepDives }: DeepDiveTabsProps) {
  const [activeTab, setActiveTab] = useState<'sales' | 'expenses' | 'marketing' | 'cash'>('sales');

  const tabs = [
    { id: 'sales', label: 'Sales & Pricing', icon: ShoppingBag },
    { id: 'expenses', label: 'Expense Optimization', icon: Wallet },
    { id: 'marketing', label: 'Meta Ads & Acquisition', icon: Megaphone },
    { id: 'cash', label: 'Working Capital & Runway', icon: DollarSign },
  ] as const;

  const current = deepDives || {
    salesAndPricing: { strengths: [], risks: [], recommendations: [] },
    costOptimization: { wasteIdentified: [], savingsOpportunities: [], highestRiskExpense: '' },
    marketingAndAds: { roasEvaluation: '', budgetAdvice: '', scalingTactics: [] },
    cashFlowAndCapital: { burnRateVerdict: '', partnerCapitalAdvice: '', runwayAssessment: '' },
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-xs space-y-5">
      <div>
        <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
          Financial &amp; Operational Deep-Dive Audits
        </h2>
        <p className="text-xs text-muted-foreground">
          Diagnostic evaluations broken down across core business mechanics.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap sm:flex-nowrap gap-1 bg-muted p-1 rounded-lg border border-border w-full sm:w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-card text-foreground font-semibold shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={14} className="shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'sales' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
              <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                Identified Strengths
              </h4>
              <ul className="space-y-2 text-xs text-neutral-300">
                {current.salesAndPricing.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
              <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={13} />
                Vulnerabilities &amp; COD Risk
              </h4>
              <ul className="space-y-2 text-xs text-neutral-300">
                {current.salesAndPricing.risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
              <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb size={13} />
                Pricing &amp; AOV Tactics
              </h4>
              <ul className="space-y-2 text-xs text-neutral-300">
                {current.salesAndPricing.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-4">
            {current.costOptimization.highestRiskExpense && (
              <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-xs text-rose-300">
                <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                <div>
                  <span className="font-semibold block uppercase tracking-wider text-[11px]">Primary Cost Hazard:</span>
                  <span>{current.costOptimization.highestRiskExpense}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle size={13} />
                  Operational Waste &amp; Inefficiencies
                </h4>
                <ul className="space-y-2 text-xs text-neutral-300">
                  {current.costOptimization.wasteIdentified.map((w, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 size={13} />
                  Immediate Savings Opportunities
                </h4>
                <ul className="space-y-2 text-xs text-neutral-300">
                  {current.costOptimization.savingsOpportunities.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'marketing' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  ROAS &amp; Efficiency Assessment
                </h4>
                <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                  {current.marketingAndAds.roasEvaluation}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Budget Allocation &amp; Pacing
                </h4>
                <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                  {current.marketingAndAds.budgetAdvice}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
              <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb size={13} />
                Actionable Scaling &amp; Creative Tactics
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-300">
                {current.marketingAndAds.scalingTactics.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 bg-neutral-900/40 p-2.5 rounded-lg border border-neutral-800/80">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'cash' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
              <h4 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
                Burn Rate &amp; Net Cash Flow
              </h4>
              <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                {current.cashFlowAndCapital.burnRateVerdict}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
              <h4 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
                Working Capital Runway
              </h4>
              <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                {current.cashFlowAndCapital.runwayAssessment}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
              <h4 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
                Partner Capital &amp; Distribution Limits
              </h4>
              <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                {current.cashFlowAndCapital.partnerCapitalAdvice}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
