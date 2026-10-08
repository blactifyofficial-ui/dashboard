'use client';

import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Check, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Equal, 
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DailyPlanItem } from './MetaAdsCalendar';

export interface CampaignEntry {
  id: string;
  name: string;
  budget: number;
  status?: 'IN_PROGRESS' | 'DONE' | 'NOT_DONE';
}

interface DailyCampaignPlannerProps {
  selectedDate: string;
  onDateChange: (dateStr: string) => void;
  currentPlan: DailyPlanItem | null;
  defaultDailyBudget: number;
  onSavePlan: (planData: {
    date: string;
    totalBudget: number;
    campaignCount: number;
    distributionMode: 'ALL_SAME' | 'DIFFERENT';
    campaigns: CampaignEntry[];
    status: 'IN_PROGRESS' | 'DONE' | 'NOT_DONE';
    notes: string;
  }) => Promise<boolean>;
  canEdit: boolean;
  todayStr: string;
}

export default function DailyCampaignPlanner({
  selectedDate,
  onDateChange,
  currentPlan,
  defaultDailyBudget,
  onSavePlan,
  canEdit,
  todayStr,
}: DailyCampaignPlannerProps) {
  // Parse initial campaigns
  const initialPlanData = useMemo(() => {
    if (currentPlan) {
      const mode = currentPlan.distributionMode || 'ALL_SAME';
      const st = currentPlan.status || 'IN_PROGRESS';
      const n = currentPlan.notes || '';

      let parsed: CampaignEntry[] = [];
      try {
        if (currentPlan.campaigns) {
          parsed = JSON.parse(currentPlan.campaigns);
        }
      } catch (err) {
        console.error('Failed to parse campaigns JSON:', err);
      }

      if (Array.isArray(parsed) && parsed.length > 0) {
        return {
          distributionMode: mode,
          status: st,
          notes: n,
          campaigns: parsed,
          sameBudgetAmount: parsed[0]?.budget?.toString() || '400',
        };
      } else {
        const count = parseInt(currentPlan.campaignCount || '1', 10) || 1;
        const total = parseFloat(currentPlan.totalBudget) || defaultDailyBudget;
        const each = count > 0 ? Math.round(total / count) : total;
        const generated: CampaignEntry[] = Array.from({ length: count }, (_, i) => ({
          id: String(i + 1),
          name: `Campaign ${i + 1}`,
          budget: each,
          status: st,
        }));
        return {
          distributionMode: mode,
          status: st,
          notes: n,
          campaigns: generated,
          sameBudgetAmount: each.toString(),
        };
      }
    }

    const initBudget = defaultDailyBudget > 0 ? defaultDailyBudget : 400;
    return {
      distributionMode: 'ALL_SAME' as const,
      status: 'IN_PROGRESS' as const,
      notes: '',
      campaigns: [{ id: '1', name: 'Campaign 1', budget: initBudget, status: 'IN_PROGRESS' as const }],
      sameBudgetAmount: initBudget.toString(),
    };
  }, [currentPlan, defaultDailyBudget]);

  // Form State
  const [distributionMode, setDistributionMode] = useState<'ALL_SAME' | 'DIFFERENT'>(initialPlanData.distributionMode);
  const [sameBudgetAmount, setSameBudgetAmount] = useState<string>(initialPlanData.sameBudgetAmount);
  const [campaigns, setCampaigns] = useState<CampaignEntry[]>(initialPlanData.campaigns);
  const [status, setStatus] = useState<'IN_PROGRESS' | 'DONE' | 'NOT_DONE'>(initialPlanData.status);
  const [notes, setNotes] = useState<string>(initialPlanData.notes);
  const [isSaving, setIsSaving] = useState(false);

  // Handle previous & next day navigation
  const navigateDay = (offsetDays: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d + offsetDays);
    const newY = dateObj.getFullYear();
    const newM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const newD = String(dateObj.getDate()).padStart(2, '0');
    onDateChange(`${newY}-${newM}-${newD}`);
  };

  // Date Formatting for Display
  const formattedDateTitle = useMemo(() => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };
    return dateObj.toLocaleDateString('en-IN', options);
  }, [selectedDate]);

  const isToday = selectedDate === todayStr;

  // Handle Changing Distribution Mode
  const handleModeChange = (newMode: 'ALL_SAME' | 'DIFFERENT') => {
    setDistributionMode(newMode);
    if (newMode === 'ALL_SAME') {
      const base = parseFloat(sameBudgetAmount) || 400;
      setCampaigns((prev) =>
        prev.map((c) => ({ ...c, budget: base }))
      );
    }
  };

  // When in "ALL_SAME" mode and user modifies the common budget
  const handleSameBudgetChange = (valStr: string) => {
    setSameBudgetAmount(valStr);
    const val = Math.max(0, parseFloat(valStr) || 0);
    setCampaigns((prev) =>
      prev.map((c) => ({ ...c, budget: val }))
    );
  };

  // When in "DIFFERENT" mode and user modifies a specific campaign's budget
  const handleIndividualBudgetChange = (idx: number, valStr: string) => {
    const val = Math.max(0, parseFloat(valStr) || 0);
    setCampaigns((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], budget: val };
      return updated;
    });
  };

  // Modify Campaign Name
  const handleCampaignNameChange = (idx: number, name: string) => {
    setCampaigns((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], name };
      return updated;
    });
  };

  // Add Campaign
  const handleAddCampaign = () => {
    const newId = String(campaigns.length + 1);
    const defaultBudget = distributionMode === 'ALL_SAME' ? (parseFloat(sameBudgetAmount) || 400) : 400;
    setCampaigns((prev) => [
      ...prev,
      {
        id: newId,
        name: `Campaign ${prev.length + 1}`,
        budget: defaultBudget,
        status: status,
      }
    ]);
  };

  // Remove Campaign
  const handleRemoveCampaign = (idx: number) => {
    if (campaigns.length <= 1) {
      toast.error('You must keep at least 1 campaign');
      return;
    }
    setCampaigns((prev) => prev.filter((_, i) => i !== idx));
  };

  // Quick preset count setter (e.g. 1, 2, 3, 4, 5 campaigns)
  const setCampaignCountDirect = (targetCount: number) => {
    const count = Math.max(1, Math.min(12, targetCount));
    const baseBudget = distributionMode === 'ALL_SAME' ? (parseFloat(sameBudgetAmount) || 400) : 400;

    setCampaigns((prev) => {
      if (prev.length === count) return prev;
      if (prev.length < count) {
        const extra = Array.from({ length: count - prev.length }, (_, i) => ({
          id: String(prev.length + i + 1),
          name: `Campaign ${prev.length + i + 1}`,
          budget: baseBudget,
          status: status,
        }));
        return [...prev, ...extra];
      } else {
        return prev.slice(0, count);
      }
    });
  };

  // Calculate Total Daily Budget Sum
  const calculatedTotalBudget = useMemo(() => {
    return campaigns.reduce((acc, c) => acc + (c.budget || 0), 0);
  }, [campaigns]);

  // Save Submission
  const handleSave = async () => {
    if (!canEdit) {
      toast.error('You do not have permission to edit Meta Ads Daily Planner');
      return;
    }

    if (campaigns.length === 0) {
      toast.error('Please add at least one campaign');
      return;
    }

    try {
      setIsSaving(true);
      const success = await onSavePlan({
        date: selectedDate,
        totalBudget: calculatedTotalBudget,
        campaignCount: campaigns.length,
        distributionMode,
        campaigns,
        status,
        notes,
      });

      if (success) {
        toast.success(`Plan saved for ${selectedDate} (₹${calculatedTotalBudget.toLocaleString('en-IN')})`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save daily plan');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Date Header & Quick Navigation */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => navigateDay(-1)}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
              title="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => navigateDay(1)}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
              title="Next Day"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground tracking-tight">
                {formattedDateTitle}
              </h3>
              {isToday && (
                <span className="px-2 py-0.5 bg-muted border border-border text-foreground text-[10px] font-semibold rounded-md uppercase tracking-wider">
                  Today
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Configure daily campaigns &amp; allocate budgets</p>
          </div>
        </div>

        {/* Status Pill Badge */}
        <div className="hidden sm:block">
          {status === 'DONE' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 size={13} />
              Done
            </span>
          )}
          {status === 'IN_PROGRESS' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <Clock size={13} />
              In Progress
            </span>
          )}
          {status === 'NOT_DONE' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border">
              <XCircle size={13} />
              Not Done
            </span>
          )}
        </div>
      </div>

      {/* Campaign Controls: Count & Distribution Toggle */}
      <div className="space-y-4 mb-4">
        <div className="bg-card border border-border rounded-lg p-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Layers size={14} className="text-muted-foreground" />
                Number of Campaigns
              </span>
              <p className="text-[11px] text-muted-foreground">Total active campaigns running on this date</p>
            </div>

            {/* Campaign Stepper */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-muted/60 border border-border rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setCampaignCountDirect(campaigns.length - 1)}
                  disabled={campaigns.length <= 1}
                  className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors text-sm font-semibold"
                >
                  -
                </button>
                <span className="w-8 text-center text-xs font-semibold text-foreground">
                  {campaigns.length}
                </span>
                <button
                  type="button"
                  onClick={() => setCampaignCountDirect(campaigns.length + 1)}
                  disabled={campaigns.length >= 10}
                  className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors text-sm font-semibold"
                >
                  +
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setCampaignCountDirect(cnt)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                      campaigns.length === cnt
                        ? 'bg-primary text-primary-foreground font-semibold border border-primary'
                        : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Budget Mode Selector */}
          <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <SlidersHorizontal size={14} className="text-muted-foreground" />
              Budget Allocation Mode
            </span>

            <div className="flex items-center bg-muted/60 border border-border p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => handleModeChange('ALL_SAME')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  distributionMode === 'ALL_SAME'
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Equal size={13} />
                <span>All Same</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('DIFFERENT')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  distributionMode === 'DIFFERENT'
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <SlidersHorizontal size={13} />
                <span>Custom</span>
              </button>
            </div>
          </div>

          {/* If All Same is selected: Single common budget input */}
          {distributionMode === 'ALL_SAME' && (
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/40 p-2.5 rounded-lg border border-border">
              <span className="text-xs text-foreground">Set budget for each of {campaigns.length} campaigns:</span>
              <div className="relative w-full sm:w-44">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={sameBudgetAmount}
                  onChange={(e) => handleSameBudgetChange(e.target.value)}
                  placeholder="400"
                  className="w-full bg-card border border-border rounded-md pl-6 pr-12 py-1 text-xs font-semibold text-foreground focus:outline-none focus:border-border-hover focus:ring-1 focus:ring-foreground/20"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium">
                  / campaign
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Campaign Item Cards */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1 no-scrollbar">
          {campaigns.map((camp, idx) => (
            <div
              key={camp.id || idx}
              className="bg-card border border-border rounded-lg p-2.5 flex items-center justify-between gap-3 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="w-5 h-5 rounded bg-muted text-muted-foreground font-semibold text-[11px] flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={camp.name}
                  onChange={(e) => handleCampaignNameChange(idx, e.target.value)}
                  placeholder={`Campaign ${idx + 1}`}
                  className="bg-transparent border-b border-transparent hover:border-border focus:border-foreground/40 text-xs font-semibold text-foreground px-1 py-0.5 w-full focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-28 sm:w-32">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    disabled={distributionMode === 'ALL_SAME'}
                    value={camp.budget}
                    onChange={(e) => handleIndividualBudgetChange(idx, e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-md pl-6 pr-2 py-1 text-xs font-semibold text-foreground focus:outline-none focus:border-border-hover disabled:opacity-75 transition-colors"
                  />
                </div>

                {campaigns.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCampaign(idx)}
                    className="p-1 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                    title="Remove Campaign"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Campaign Button */}
        <button
          type="button"
          onClick={handleAddCampaign}
          className="w-full py-2 bg-card hover:bg-muted border border-dashed border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus size={14} />
          <span>Add Another Campaign</span>
        </button>

        {/* Daily Total Calculation Banner */}
        <div className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Spend for {formattedDateTitle}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground tracking-tight">
                ₹{calculatedTotalBudget.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-muted-foreground">
                ({campaigns.length} {campaigns.length === 1 ? 'campaign' : 'campaigns'})
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-muted-foreground block">Default Base Target</span>
            <span className="text-xs font-semibold text-foreground">
              ₹{defaultDailyBudget.toLocaleString('en-IN')}/day
            </span>
          </div>
        </div>

        {/* Status Under That: In Progress / Done / Not Done */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground block">
            Execution Status
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setStatus('IN_PROGRESS')}
              className={`py-2 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                status === 'IN_PROGRESS'
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300 font-semibold'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Clock size={13} />
              <span>In Progress</span>
            </button>

            <button
              type="button"
              onClick={() => setStatus('DONE')}
              className={`py-2 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                status === 'DONE'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <CheckCircle2 size={13} />
              <span>Done</span>
            </button>

            <button
              type="button"
              onClick={() => setStatus('NOT_DONE')}
              className={`py-2 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                status === 'NOT_DONE'
                  ? 'bg-muted border-border text-foreground font-semibold'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <XCircle size={13} />
              <span>Not Done</span>
            </button>
          </div>
        </div>

        {/* Notes Textarea */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground block">
            Day Notes &amp; Observations (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="e.g. Scaled Retargeting budget by 20%, turned off fatigued creative..."
            className="w-full bg-card border border-border rounded-lg p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border-hover focus:ring-1 focus:ring-foreground/20 transition-colors"
          />
        </div>

        {/* Save Action Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !canEdit}
          className="w-full py-2.5 bg-primary text-primary-foreground hover:opacity-90 active:opacity-80 disabled:opacity-50 font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-opacity"
        >
          {isSaving ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>Saving Plan...</span>
            </>
          ) : (
            <>
              <Check size={15} />
              <span>Save Daily Plan (₹{calculatedTotalBudget.toLocaleString('en-IN')})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
