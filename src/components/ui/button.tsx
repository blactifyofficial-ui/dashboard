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
    | "subtle"
  | "utility"
  | "pearl";
size ?: "default" | "sm" | "xs" | "lg" | "icon" | "icon-sm";
isLoading ?: boolean;
loading ?: boolean;
asChild ?: boolean;
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

    // Apple button base styles: active scale micro-interaction, clean typography, 0 shadows
    const baseStyles =
    "inline-flex items-center justify-center font-normal transition-all duration-100 select-none cursor-pointer disabled:pointer-events-none disabled:opacity-40 active:scale-95 focus-visible:outline-2 focus-visible:outline-[#0071e3] focus-visible:outline-offset-2";

    const variantStyles: Record<string, string> = {
      // Apple Action Blue pill CTA
      default:
      "bg-[#0066cc] hover:bg-[#0071e3] text-white border border-transparent rounded-full",
      // Apple ghost pill CTA
      secondary:
      "bg-transparent text-[#0066cc] dark:text-[#2997ff] border border-[#0066cc] dark:border-[#2997ff] hover:bg-[#0066cc]/10 dark:hover:bg-[#2997ff]/10 rounded-full",
      // Apple hairline outline
      outline:
      "border border-border bg-card text-foreground hover:bg-muted/60 rounded-full",
      // Apple ghost
      ghost:
      "hover:bg-muted/60 text-muted-foreground hover:text-foreground rounded-full",
      // Apple system red
      destructive:
      "bg-[#ff453a] hover:bg-[#ff3b30] text-white border border-transparent rounded-full",
      // Apple text link (Action Blue)
      link:
      "text-[#0066cc] dark:text-[#2997ff] underline-offset-4 hover:underline p-0 h-auto font-normal rounded-none active:scale-100",
      // Apple subtle chip
      subtle:
      "bg-muted/70 text-foreground hover:bg-muted border border-border/40 rounded-full",
      // Apple Dark Utility button (8px radius)
      utility:
        "bg-[#1d1d1f] text-white hover:bg-[#272729] rounded-[8px] border border-transparent",
      // Apple Pearl button (11px radius)
      pearl:
        "bg-[#fafafc] text-[#333333] hover:bg-white border border-[#f0f0f0] rounded-[11px]",
    };

    const sizeStyles: Record<string, string> = {
      default: "h-[38px] px-[20px] py-[9px] text-[15px] sm:text-[17px] tracking-[-0.374px] gap-2",
      sm: "h-[32px] px-[16px] py-[6px] text-[13px] sm:text-[14px] tracking-[-0.224px] gap-1.5",
      xs: "h-[28px] px-[12px] py-[4px] text-[12px] tracking-[-0.12px] gap-1",
      lg: "h-[44px] px-[26px] py-[12px] text-[17px] sm:text-[18px] tracking-[-0.374px] gap-2.5",
      icon: "h-[44px] w-[44px] p-0 rounded-full shrink-0",
      "icon-sm": "h-[34px] w-[34px] p-0 rounded-full shrink-0",
    };

    const combinedClassName = cn(
      baseStyles,
      variantStyles[variant] || variantStyles.default,
      sizeStyles[size] || sizeStyles.default,
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
