import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  pill?: boolean;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type = "text", pill = false, ...props }, ref) => {
      return (
        <input
          type={type}
          className={cn(
            "flex h-[40px] sm:h-[44px] w-full border border-border bg-card px-4 py-2 text-[14px] sm:text-[17px] tracking-[-0.374px] text-foreground transition-all duration-100 placeholder:text-muted-foreground/60 focus-visible:outline-2 focus-visible:outline-[#0071e3] focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40",
            pill ? "rounded-full" : "rounded-[11px]",
            className
          )}
          ref={ref}
          {...props}
        />
      );
    }
);
Input.displayName = "Input";
