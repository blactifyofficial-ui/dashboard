import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
  | "default"
  | "secondary"
  | "outline"
  | "destructive"
  | "success"
  | "warning"
  | "info"
  | "neutral"
  | "subtle";
  size?: "default" | "sm" | "xs" | "lg";
  dot?: boolean;
}

export function Badge({
  className,
  variant = "default",
  size = "default",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  // Apple subtle pill chip styles: clean hairline, quiet translucent tone, zero shadows
  const baseStyles =
  "inline-flex items-center font-normal transition-colors select-none whitespace-nowrap rounded-full";

  const variantStyles: Record<string, { badge: string; dot: string }> = {
    default: {
      badge: "bg-[#0066cc]/10 dark:bg-[#2997ff]/15 text-[#0066cc] dark:text-[#2997ff] border border-[#0066cc]/20 dark:border-[#2997ff]/30",
      dot: "bg-[#0066cc] dark:bg-[#2997ff]",
    },
    secondary: {
      badge: "bg-muted text-foreground border border-border",
      dot: "bg-muted-foreground",
    },
    outline: {
      badge: "text-foreground border border-border bg-transparent",
      dot: "bg-foreground",
    },
    destructive: {
      badge: "bg-[#ff453a]/10 text-[#ff453a] border border-[#ff453a]/25",
      dot: "bg-[#ff453a]",
    },
    success: {
      badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
      dot: "bg-emerald-500",
    },
    warning: {
      badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
      dot: "bg-amber-500",
    },
    info: {
      badge: "bg-[#0066cc]/10 dark:bg-[#2997ff]/15 text-[#0066cc] dark:text-[#2997ff] border border-[#0066cc]/20",
      dot: "bg-[#0066cc] dark:bg-[#2997ff]",
    },
    neutral: {
      badge: "bg-muted/80 text-muted-foreground border border-border/80",
      dot: "bg-muted-foreground",
    },
    subtle: {
      badge: "bg-muted/60 text-muted-foreground border border-border/60",
      dot: "bg-muted-foreground",
    },
  };

  const sizeStyles: Record<string, { badge: string; dot: string }> = {
    default: {
      badge: "px-2.5 py-0.5 text-[12px] tracking-[-0.12px] gap-1.5",
      dot: "h-1.5 w-1.5 rounded-full shrink-0",
    },
    sm: {
      badge: "px-2 py-0.5 text-[11px] tracking-[-0.1px] gap-1",
      dot: "h-1 w-1 rounded-full shrink-0",
    },
    xs: {
      badge: "px-1.5 py-0.25 text-[10px] tracking-[-0.08px] gap-1",
      dot: "h-1 w-1 rounded-full shrink-0",
    },
    lg: {
      badge: "px-3 py-1 text-[14px] tracking-[-0.224px] gap-2",
      dot: "h-2 w-2 rounded-full shrink-0",
    },
  };

  const v = variantStyles[variant] || variantStyles.default;
  const s = sizeStyles[size] || sizeStyles.default;

  return (
    <div
      className={cn(baseStyles, v.badge, s.badge, className)}
      {...props}
    >
      {dot && <span className={cn(s.dot, v.dot)} aria-hidden="true" />}
      {children}
    </div>
  );
}
