"use client";

import * as React from "react";
import { Search, X, Command as CommandIcon, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CommandItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  icon?: React.ElementType;
  shortcut?: string;
  onSelect: () => void;
}

export function CommandMenu({
  open,
  onOpenChange,
  items,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
}) {
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  // Filter items
  const filteredItems = React.useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
    );
  }, [items, query]);

  // Group by category
  const grouped = React.useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of filteredItems) {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [filteredItems]);

  // Keyboard navigation & ESC
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1 < filteredItems.length ? i + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 >= 0 ? i - 1 : filteredItems.length - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (selected) {
          selected.onSelect();
          onOpenChange(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, filteredItems, selectedIndex, onOpenChange]);

  if (!open) return null;

  let flatIndex = -1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] sm:pt-[15vh] p-3 sm:p-4">
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-foreground flex flex-col max-h-[70vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-border bg-card shrink-0">
          <Search className="w-4 h-4 text-muted-foreground mr-3 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent py-3.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
            placeholder="Search commands, pages, or tools (e.g. 'Revenue', 'Sync', 'COD')..."
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setSelectedIndex(0);
              }}
              className="p-1 rounded text-muted-foreground hover:text-foreground text-xs"
            >
              Clear
            </button>
          )}
          <kbd
            onClick={() => onOpenChange(false)}
            className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 ml-2 text-[10px] font-mono text-muted-foreground bg-muted border border-border rounded cursor-pointer"
          >
            ESC
          </kbd>
          <button
            onClick={() => onOpenChange(false)}
            className="ml-2 p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-2 overflow-y-auto flex-1 divide-y divide-border/40">
          {filteredItems.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <CommandIcon className="w-6 h-6 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No matching results found for &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            Array.from(grouped.entries()).map(([category, catItems]) => (
              <div key={category} className="py-1.5 first:pt-0 last:pb-0">
                <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase block">
                  {category}
                </span>
                <div className="mt-0.5 space-y-0.5">
                  {catItems.map((item) => {
                    flatIndex++;
                    const isSelected = flatIndex === selectedIndex;
                    const Icon = item.icon || ArrowRight;

                    return (
                      <div
                        key={item.id}
                        onMouseEnter={() => setSelectedIndex(flatIndex)}
                        onClick={() => {
                          item.onSelect();
                          onOpenChange(false);
                        }}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs sm:text-sm select-none transition-colors",
                          isSelected
                            ? "bg-primary text-primary-foreground font-medium shadow-xs"
                            : "text-foreground hover:bg-muted"
                        )}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className={cn("w-4 h-4 shrink-0", isSelected ? "text-primary-foreground" : "text-muted-foreground")} />
                          <div className="flex flex-col truncate">
                            <span className="truncate">{item.title}</span>
                            {item.description && (
                              <span className={cn("text-[11px] truncate", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                                {item.description}
                              </span>
                            )}
                          </div>
                        </div>

                        {item.shortcut && (
                          <kbd
                            className={cn(
                              "text-[10px] font-mono px-1.5 py-0.5 rounded border",
                              isSelected
                                ? "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30"
                                : "bg-muted text-muted-foreground border-border"
                            )}
                          >
                            {item.shortcut}
                          </kbd>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 border-t border-border bg-muted/40 text-[11px] text-muted-foreground flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono bg-muted px-1 rounded border border-border">↑</kbd> <kbd className="font-mono bg-muted px-1 rounded border border-border">↓</kbd> navigate</span>
            <span><kbd className="font-mono bg-muted px-1 rounded border border-border">↵</kbd> select</span>
          </div>
          <span>Blactify Command</span>
        </div>
      </div>
    </div>
  );
}
