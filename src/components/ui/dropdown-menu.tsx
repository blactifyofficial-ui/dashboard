"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownContext = React.createContext<DropdownContextValue | undefined>(undefined);

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close when clicked outside
  React.useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = React.useContext(DropdownContext);
  if (!ctx) throw new Error("DropdownMenuTrigger must be inside DropdownMenu");

  return (
    <button
      type="button"
      className={cn("active:scale-95 transition-transform", className)}
      onClick={() => ctx.setOpen(!ctx.open)}
      aria-expanded={ctx.open}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  align = "right",
  className,
  children,
  ...props
}: {
  align?: "left" | "right" | "center";
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(DropdownContext);
  if (!ctx || !ctx.open) return null;

  const alignStyles = {
    left: "left-0",
    right: "right-0",
    center: "left-1/2 -translate-x-1/2",
  };

  return (
    <div
      role="menu"
      className={cn(
        "absolute z-50 mt-1.5 min-w-[200px] rounded-[14px] border border-border bg-card/95 backdrop-blur-md p-1.5 text-foreground animate-in fade-in zoom-in-95 duration-100",
        alignStyles[align],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  className,
  children,
  onSelect,
  disabled,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(DropdownContext);

  return (
    <div
      role="menuitem"
      aria-disabled={disabled}
      onClick={() => {
        if (disabled) return;
        onSelect?.();
        ctx?.setOpen(false);
      }}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-[8px] px-3 py-2 text-[13px] sm:text-[14px] tracking-[-0.224px] outline-none transition-colors hover:bg-muted text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
        disabled && "opacity-40 pointer-events-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="separator"
      className={cn("-mx-1 my-1.5 h-px bg-border/60", className)}
      {...props}
    />
  );
}

export function DropdownMenuLabel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider", className)}
      {...props}
    >
      {children}
    </div>
  );
}
