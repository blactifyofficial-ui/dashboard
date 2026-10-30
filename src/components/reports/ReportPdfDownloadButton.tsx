"use client";

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ReportPdfDownloadButtonProps {
  month: string;
  monthDisplay?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function ReportPdfDownloadButton({
  month,
  monthDisplay,
  variant = 'primary',
  size = 'md',
  className = '',
  label = 'Download PDF',
}: ReportPdfDownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;
    setLoading(true);
    const toastId = toast.loading(`Generating ${monthDisplay || month} PDF report...`);

    try {
      const res = await fetch(`/api/reports/${month}/pdf`, {
        method: 'GET',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to download report PDF');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Blactify-Financial-Report-${month}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Financial Report PDF downloaded successfully', { id: toastId });
    } catch (err: unknown) {
      console.error('Error downloading PDF:', err);
      toast.error(err instanceof Error ? err.message : 'Error generating PDF', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5 min-h-[32px]',
    md: 'text-xs sm:text-sm px-3.5 py-2 gap-2 min-h-[38px]',
    lg: 'text-sm sm:text-base px-5 py-2.5 gap-2.5 min-h-[44px]',
  }[size];

  const variantStyles = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs font-semibold',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border',
    outline: 'bg-card text-foreground border border-border hover:bg-muted shadow-2xs',
    ghost: 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
  }[variant];

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      title={`Download ${monthDisplay || month} PDF`}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 13 : 16} className="animate-spin shrink-0" />
      ) : (
        <Download size={size === 'sm' ? 13 : 16} className="shrink-0" />
      )}
      <span>{loading ? 'Generating...' : label}</span>
    </button>
  );
}

