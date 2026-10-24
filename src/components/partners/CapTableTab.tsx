'use client';

import { Partner, SummaryData } from './types';
import { formatCurrency } from './utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface CapTableTabProps {
  partners: Partner[];
  summary: SummaryData | null;
}

export default function CapTableTab({ partners, summary }: CapTableTabProps) {
  const totalFund = summary?.totalInvested || 0;

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-semibold text-foreground">Equity &amp; Ownership Cap Table</h3>
            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-foreground border border-border">
              {summary?.totalAllocatedEquity || 0}% Allocated
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead className="font-medium">Partner</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium">Equity Stake (%)</TableHead>
                <TableHead className="font-medium">Total Invested</TableHead>
                <TableHead className="font-medium">Payouts Taken</TableHead>
                <TableHead className="font-medium">Withdrawn</TableHead>
                <TableHead className="font-medium">Net Capital Balance</TableHead>
                <TableHead className="font-medium">Share of Capital Fund</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map((partner) => {
                const capitalShare = totalFund > 0 ? ((partner.totalInvested / totalFund) * 100).toFixed(1) : '0.0';
                const isActive = partner.status === 'ACTIVE';

                return (
                  <TableRow key={partner.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-semibold text-foreground">
                      {partner.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={isActive ? 'default' : 'secondary'}
                        size="sm"
                      >
                        {partner.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-foreground font-mono">
                      {partner.equityPercentage}%
                    </TableCell>
                    <TableCell className="text-foreground font-mono font-medium">
                      {formatCurrency(partner.totalInvested)}
                    </TableCell>
                    <TableCell className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                      {formatCurrency(partner.totalPayout || 0)}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono">
                      {formatCurrency(partner.totalWithdrawn)}
                    </TableCell>
                    <TableCell className="font-bold text-foreground font-mono">
                      {formatCurrency(partner.netCapital)}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono">
                      {capitalShare}%
                    </TableCell>
                  </TableRow>
                );
              })}
              {/* Totals Row */}
              <TableRow className="border-t-2 border-border bg-muted/30 font-bold text-foreground font-mono text-xs hover:bg-muted/30">
                <TableCell className="font-sans font-bold">Total</TableCell>
                <TableCell className="font-sans font-normal text-muted-foreground">—</TableCell>
                <TableCell className="text-foreground">{summary?.totalAllocatedEquity || 0}%</TableCell>
                <TableCell className="text-foreground">{formatCurrency(summary?.totalInvested || 0)}</TableCell>
                <TableCell className="text-emerald-600 dark:text-emerald-400">{formatCurrency(summary?.totalPayouts || 0)}</TableCell>
                <TableCell className="text-muted-foreground">{formatCurrency(summary?.totalWithdrawn || 0)}</TableCell>
                <TableCell className="text-foreground">{formatCurrency(summary?.netActiveCapitalPool || 0)}</TableCell>
                <TableCell className="text-foreground">100%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
