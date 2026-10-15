'use client';

import { useState } from 'react';
import { Zap, Target, Rocket, ArrowRight, CheckCircle, Tag } from 'lucide-react';
import { StrategicActionItem } from '@/lib/ai/prompts';

interface StrategicRoadmapProps {
  roadmap: {
    immediateActions: StrategicActionItem[];
    tacticalMonthly: StrategicActionItem[];
    quarterlyGrowth: StrategicActionItem[];
  };
}

export default function StrategicRoadmap({ roadmap }: StrategicRoadmapProps) {
  const [activeTab, setActiveTab] = useState<'all' | '7d' | '30d' | '90d'>('all');

  const horizons = [
    {
      id: '7d',
      title: 'Immediate Moves (Next 7 Days)',
      subtitle: 'Urgent operational fixes & cost leaks',
      icon: Zap,
      iconColor: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      items: roadmap?.immediateActions || [],
    },
    {
      id: '30d',
      title: 'Tactical Plays (Next 30 Days)',
      subtitle: 'AOV boosters & margin defense initiatives',
      icon: Target,
      iconColor: 'text-blue-400',
      badgeBg: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
      items: roadmap?.tacticalMonthly || [],
    },
    {
      id: '90d',
      title: 'Growth Plays (60–90 Days)',
      subtitle: 'Structural scaling & category expansion',
      icon: Rocket,
      iconColor: 'text-purple-400',
      badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
      items: roadmap?.quarterlyGrowth || [],
    },
  ];

  const displayedHorizons = activeTab === 'all' ? horizons : horizons.filter((h) => h.id === activeTab);

  return (
    <div className="space-y-4">
      {/* Header & Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
            <span>Executive Strategic Roadmap ("Strategy to Follow")</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Phased tactical playbook generated specifically for your current cash position, order volume, and ad spend.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border w-fit text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-card text-foreground font-semibold shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Horizons
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('7d')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              activeTab === '7d'
                ? 'bg-card text-foreground font-semibold shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            7 Days
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('30d')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              activeTab === '30d'
                ? 'bg-card text-foreground font-semibold shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            30 Days
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('90d')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              activeTab === '90d'
                ? 'bg-card text-foreground font-semibold shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            60-90 Days
          </button>
        </div>
      </div>

      {/* Columns Grid */}
      <div className={`grid grid-cols-1 ${activeTab === 'all' ? 'lg:grid-cols-3' : 'grid-cols-1'} gap-4`}>
        {displayedHorizons.map((h) => {
          const Icon = h.icon;
          return (
            <div
              key={h.id}
              className="bg-card border border-border rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs space-y-4"
            >
              {/* Column Header */}
              <div className="border-b border-border pb-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-neutral-800 border border-neutral-700">
                      <Icon size={14} className={h.iconColor} />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-foreground">{h.title}</span>
                  </div>
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border ${h.badgeBg}`}>
                    {h.items.length} Tasks
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">{h.subtitle}</p>
              </div>

              {/* Tasks List */}
              <div className="space-y-3 flex-1">
                {h.items.length === 0 ? (
                  <div className="p-4 rounded-lg bg-muted/40 text-center text-xs text-muted-foreground">
                    No immediate tasks assigned for this timeframe.
                  </div>
                ) : (
                  h.items.map((task, idx) => {
                    const impactColor =
                      task.impact === 'HIGH'
                        ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                        : 'text-blue-400 bg-blue-500/10 border-blue-500/20';

                    const effortColor =
                      task.effort === 'LOW'
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        : task.effort === 'MEDIUM'
                        ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                        : 'text-rose-400 bg-rose-500/10 border-rose-500/20';

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-neutral-950/70 border border-neutral-800 space-y-2 hover:border-neutral-700 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-semibold text-neutral-100 flex items-center gap-1.5 leading-snug">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            {task.title}
                          </span>
                        </div>

                        <p className="text-[11px] text-neutral-400 leading-relaxed font-sans pl-3 border-l border-neutral-800">
                          {task.detail}
                        </p>

                        <div className="flex items-center gap-1.5 pt-1 text-[10px] font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                            {task.category}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded border ${impactColor}`}>
                            {task.impact} Impact
                          </span>
                          <span className={`px-1.5 py-0.5 rounded border ${effortColor}`}>
                            {task.effort} Effort
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
