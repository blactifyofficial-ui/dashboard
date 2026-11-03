import * as React from "react";
import { cn } from "@/lib/utils";

export const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
    <div className="relative w-full overflow-x-auto rounded-[18px] border border-border bg-card">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-[14px] sm:text-[17px] text-foreground tracking-[-0.374px]", className)}
        {...props}
      />
    </div>
    ));
    Table.displayName = "Table";

    export const TableHeader = React.forwardRef<
      HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({className, ...props }, ref) => (
      <thead
        ref={ref}
        className={cn("bg-muted/40 text-muted-foreground text-[12px] sm:text-[13px] font-semibold tracking-[-0.12px] border-b border-border/80", className)}
        {...props}
      />
      ));
      TableHeader.displayName = "TableHeader";

      export const TableBody = React.forwardRef<
        HTMLTableSectionElement,
      React.HTMLAttributes<HTMLTableSectionElement>
>(({className, ...props }, ref) => (
        <tbody
          ref={ref}
          className={cn("divide-y divide-border/60 [&_tr:last-child]:border-0", className)}
          {...props}
        />
        ));
        TableBody.displayName = "TableBody";

        export const TableFooter = React.forwardRef<
          HTMLTableSectionElement,
        React.HTMLAttributes<HTMLTableSectionElement>
>(({className, ...props }, ref) => (
          <tfoot
            ref={ref}
            className={cn("border-t border-border bg-muted/30 font-normal text-foreground", className)}
            {...props}
          />
          ));
          TableFooter.displayName = "TableFooter";

          export const TableRow = React.forwardRef<
            HTMLTableRowElement,
          React.HTMLAttributes<HTMLTableRowElement>
>(({className, ...props }, ref) => (
            <tr
              ref={ref}
              className={cn(
                "transition-colors hover:bg-muted/30 data-[state=selected]:bg-muted/50 select-none",
                className
              )}
              {...props}
            />
            ));
            TableRow.displayName = "TableRow";

            export const TableHead = React.forwardRef<
              HTMLTableCellElement,
            React.ThHTMLAttributes<HTMLTableCellElement>
>(({className, ...props }, ref) => (
              <th
                ref={ref}
                className={cn(
                  "h-[44px] px-4 sm:px-5 text-left align-middle font-semibold text-muted-foreground whitespace-nowrap [&:has([role=checkbox])]:pr-0",
                  className
                )}
                {...props}
              />
              ));
              TableHead.displayName = "TableHead";

              export const TableCell = React.forwardRef<
                HTMLTableCellElement,
              React.TdHTMLAttributes<HTMLTableCellElement>
>(({className, ...props }, ref) => (
                <td
                  ref={ref}
                  className={cn(
                    "py-3.5 px-4 sm:px-5 align-middle whitespace-nowrap leading-[1.47] [&:has([role=checkbox])]:pr-0",
                    className
                  )}
                  {...props}
                />
                ));
                TableCell.displayName = "TableCell";

                export const TableCaption = React.forwardRef<
                  HTMLTableCaptionElement,
                React.HTMLAttributes<HTMLTableCaptionElement>
>(({className, ...props }, ref) => (
                  <caption
                    ref={ref}
                    className={cn("mt-4 text-[12px] text-muted-foreground tracking-[-0.12px]", className)}
                    {...props}
                  />
                  ));
                  TableCaption.displayName = "TableCaption";
