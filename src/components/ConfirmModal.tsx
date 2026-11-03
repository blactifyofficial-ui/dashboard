"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: "destructive" | "default";
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  variant = "destructive",
}: ConfirmModalProps) {
  const isDestructive = variant === "destructive";

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Frosted Apple Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in duration-150"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Surface Card: 18px radius, hairline border, zero box-shadow */}
      <div
        role="alertdialog"
        aria-modal="true"
        className="relative z-50 w-full max-w-md rounded-[18px] border border-border bg-card p-6 animate-in fade-in zoom-in-95 duration-150 text-foreground"
      >
        <div className="flex items-start gap-3.5">
          <div
          className={`p-2.5 rounded-full shrink-0 ${isDestructive
              ? "bg-[#ff453a]/15 text-[#ff453a] border border-[#ff453a]/20"
              : "bg-[#0066cc]/15 text-[#0066cc] dark:text-[#2997ff] border border-[#0066cc]/20"
            }`}
          >
          <AlertTriangle className="w-5 h-5" />
        </div>

        <div className="space-y-1.5 flex-1 min-w-0">
          <h2 className="text-[17px] font-semibold text-foreground tracking-[-0.374px]">
            {title}
          </h2>
          <p className="text-[14px] text-muted-foreground leading-relaxed tracking-[-0.224px]">
            {message}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2.5 pt-5 mt-5 border-t border-border/60">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isLoading}
        >
          {cancelText}
        </Button>
        <Button
          type="button"
          variant={variant === "destructive" ? "destructive" : "default"}
          size="sm"
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {confirmText}
        </Button>
      </div>
    </div>
    </div >
  );
}
