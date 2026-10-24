import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "ghost"
    | "destructive"
    | "link"
    | "subtle";
  size?: "default" | "sm" | "xs" | "lg" | "icon" | "icon-sm";
  isLoading?: boolean;
  loading?: boolean;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      isLoading = false,
      loading = false,
      asChild = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isSpinning = isLoading || loading;

    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer text-xs sm:text-sm tracking-tight";

    const variantStyles: Record<string, string> = {
      default:
        "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs border border-transparent",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/60 shadow-xs",
      outline:
        "border border-border bg-card hover:bg-muted text-foreground shadow-xs",
      ghost:
        "hover:bg-muted text-muted-foreground hover:text-foreground",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs border border-transparent",
      link:
        "text-primary underline-offset-4 hover:underline p-0 h-auto font-normal",
      subtle:
        "bg-muted/70 text-foreground hover:bg-muted border border-border/40",
    };

    const sizeStyles: Record<string, string> = {
      default: "h-9 px-3.5 py-1.5 rounded-lg gap-2",
      sm: "h-8 px-2.5 py-1 text-xs rounded-md gap-1.5",
      xs: "h-7 px-2 py-0.5 text-[11px] rounded-md gap-1",
      lg: "h-10 px-5 py-2 text-sm rounded-lg gap-2.5",
      icon: "h-9 w-9 p-0 rounded-lg shrink-0",
      "icon-sm": "h-8 w-8 p-0 rounded-md shrink-0",
    };

    const combinedClassName = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      className
    );

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string; children?: React.ReactNode }>;
      return React.cloneElement(child, {
        className: cn(combinedClassName, child.props.className),
        ...props,
      });
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isSpinning}
        className={combinedClassName}
        {...props}
      >
        {isSpinning && (
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
