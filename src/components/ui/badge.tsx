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
  const baseStyles =
    "inline-flex items-center font-medium transition-colors select-none tracking-tight whitespace-nowrap";

  const variantStyles: Record<string, { badge: string; dot: string }> = {
    default: {
      badge: "bg-primary/10 text-primary border border-primary/25",
      dot: "bg-primary",
    },
    secondary: {
      badge: "bg-secondary text-secondary-foreground border border-border/80",
      dot: "bg-muted-foreground",
    },
    outline: {
      badge: "text-foreground border border-border bg-transparent",
      dot: "bg-foreground",
    },
    destructive: {
      badge: "bg-destructive/10 text-destructive border border-destructive/25 dark:text-red-400",
      dot: "bg-destructive",
    },
    success: {
      badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25",
      dot: "bg-emerald-500",
    },
    warning: {
      badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25",
      dot: "bg-amber-500",
    },
    info: {
      badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/25",
      dot: "bg-blue-500",
    },
    neutral: {
      badge: "bg-muted text-muted-foreground border border-border/70",
      dot: "bg-muted-foreground",
    },
    subtle: {
      badge: "bg-muted text-muted-foreground border border-border/70",
      dot: "bg-muted-foreground",
    },
  };

  const sizeStyles: Record<string, { badge: string; dot: string }> = {
    default: {
      badge: "px-2 py-0.5 text-xs rounded-md gap-1.5",
      dot: "h-1.5 w-1.5 rounded-full shrink-0",
    },
    sm: {
      badge: "px-1.5 py-0.5 text-[11px] rounded-md gap-1",
      dot: "h-1 w-1 rounded-full shrink-0",
    },
    xs: {
      badge: "px-1.5 py-0.25 text-[10px] rounded gap-1",
      dot: "h-1 w-1 rounded-full shrink-0",
    },
    lg: {
      badge: "px-2.5 py-1 text-sm rounded-lg gap-2",
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
