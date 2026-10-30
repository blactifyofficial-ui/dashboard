"use client";

import { useState } from 'react';
import { RefreshCw, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { ReportPdfDownloadButton } from './ReportPdfDownloadButton';

interface ReportActionButtonsProps {
  month: string;
  monthDisplay: string;
  emailSentAt: string | null;
  canGenerate?: boolean;
}

export function ReportActionButtons({
  month,
  monthDisplay,
  emailSentAt,
  canGenerate = true,
}: ReportActionButtonsProps) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [emailing, setEmailing] = useState(false);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    const toastId = toast.loading(`Refreshing financial metrics for ${monthDisplay}...`);

    try {
      const res = await fetch(`/api/reports/${month}/generate`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to recompile report');
      }

      toast.success(`${monthDisplay} report updated with latest data`, { id: toastId });
      router.refresh();
    } catch (err: unknown) {
      console.error('Error refreshing report:', err);
      toast.error(err instanceof Error ? err.message : 'Error refreshing report', { id: toastId });
    } finally {
      setRefreshing(false);
    }
  };

  const handleEmail = async () => {
    if (emailing) return;
    setEmailing(true);
    const toastId = toast.loading(`Sending official report & PDF to admins...`);

    try {
      const res = await fetch(`/api/reports/${month}/email`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send report email');
      }

      const data = await res.json();
      toast.success(`Report emailed to ${data.recipients?.join(', ') || 'admins'}`, { id: toastId });
      router.refresh();
    } catch (err: unknown) {
      console.error('Error emailing report:', err);
      toast.error(err instanceof Error ? err.message : 'Error emailing report', { id: toastId });
    } finally {
      setEmailing(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canGenerate && (
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-border bg-card hover:bg-muted text-foreground transition-colors disabled:opacity-50 cursor-pointer min-h-[38px]"
          title="Recalculate report from live orders and expense records"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
        </button>
      )}

      {canGenerate && (
        <button
          type="button"
          onClick={handleEmail}
          disabled={emailing}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-border bg-card hover:bg-muted text-foreground transition-colors disabled:opacity-50 cursor-pointer min-h-[38px]"
          title="Send report summary and PDF attachment to company administrators"
        >
          {emailing ? (
            <Loader2 size={14} className="animate-spin" />
          ) : emailSentAt ? (
            <CheckCircle2 size={14} className="text-emerald-500" />
          ) : (
            <Mail size={14} />
          )}
          <span>{emailing ? 'Sending...' : emailSentAt ? 'Resend Email' : 'Email to Admins'}</span>
        </button>
      )}

      <ReportPdfDownloadButton
        month={month}
        monthDisplay={monthDisplay}
        variant="primary"
        size="md"
        label="Download PDF Report"
      />
    </div>
  );
}

