'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Boxes, Flame } from 'lucide-react';

export interface TopProduct {
  title: string | null;
  imageUrl: string | null;
  revenue: number;
  unitsSold: number;
}

interface TopProductsWidgetProps {
  products: TopProduct[];
  canViewRevenue: boolean;
}

function ProductThumbnail({ src, title }: { src: string | null; title: string }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center text-foreground shrink-0 text-xs font-bold font-mono">
        {title ? title.charAt(0).toUpperCase() : '?'}
      </div>
    );
  }

  return (
    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted border border-border shrink-0">
      <Image
        src={src}
        alt={title}
        fill
        sizes="40px"
        className="object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

export default function TopProductsWidget({ products, canViewRevenue }: TopProductsWidgetProps) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-3 bg-muted/20">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-orange-500 shrink-0" />
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Top Selling Products</h3>
          <span className="text-xs text-muted-foreground font-mono">(This Month)</span>
        </div>
        <Link
          href="/inventory"
          className="text-xs text-primary hover:underline font-medium flex items-center gap-1 group"
        >
          <span>Inventory</span>
          <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>

      {/* Product List */}
      <div className="divide-y divide-border/60 flex-1 overflow-y-auto max-h-[380px]">
        {products.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center space-y-2">
            <Boxes size={28} className="text-muted-foreground/60" />
            <p className="text-sm">No product sales recorded yet</p>
          </div>
        ) : (
          products.map((prod, index) => {
            const title = prod.title || 'Unknown Product';
            const units = Math.round(Number(prod.unitsSold) || 0);
            const rev = Number(prod.revenue) || 0;

            return (
              <div
                key={prod.title || index}
                className="p-3.5 sm:px-4 sm:py-3.5 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
              >
                {/* Left: Rank & Image & Title */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs font-semibold text-muted-foreground w-4 shrink-0 text-center">
                    #{index + 1}
                  </span>

                  {/* Thumbnail with graceful fallback */}
                  <ProductThumbnail src={prod.imageUrl} title={title} />

                  {/* Title & units sold */}
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-[180px] sm:max-w-xs md:max-w-sm">
                      {title}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      <strong className="text-foreground">{units}</strong> {units === 1 ? 'unit' : 'units'} sold
                    </p>
                  </div>
                </div>

                {/* Right: Revenue */}
                {canViewRevenue && (
                  <div className="text-right shrink-0">
                    <p className="font-mono font-semibold text-xs sm:text-sm text-foreground">
                      ₹{rev.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <span className="text-[10px] text-muted-foreground font-mono">Revenue</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
