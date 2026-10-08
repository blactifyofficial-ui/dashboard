'use client';

import { Users, Plus } from 'lucide-react';
import { Partner } from './types';
import PartnerCard from './PartnerCard';

interface PartnersOverviewTabProps {
  partners: Partner[];
  totalFund: number;
  searchQuery: string;
  onOpenAddPartner: () => void;
  onAddInvestment: (partnerId: string) => void;
  onAddWithdrawal: (partnerId: string) => void;
  onAddPayout: (partnerId: string) => void;
  onViewLedger: (partner: Partner) => void;
  onEditPartner: (partner: Partner) => void;
  onDeletePartner: (partner: Partner) => void;
}

export default function PartnersOverviewTab({
  partners,
  totalFund,
  searchQuery,
  onOpenAddPartner,
  onAddInvestment,
  onAddWithdrawal,
  onAddPayout,
  onViewLedger,
  onEditPartner,
  onDeletePartner,
}: PartnersOverviewTabProps) {
  if (partners.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center mx-auto text-muted-foreground mb-4">
          <Users size={22} />
        </div>
        <h3 className="text-base font-semibold text-foreground">No partners found</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          {searchQuery
            ? 'No partners match your search query.'
            : 'Start by registering business partners to manage their invested capital, equity allocations, and drawings.'}
        </p>
        {!searchQuery && (
          <button
            onClick={onOpenAddPartner}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 text-xs font-semibold rounded-xl transition-opacity shadow-xs"
          >
            <Plus size={15} />
            <span>Add First Partner</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {partners.map((partner) => (
        <PartnerCard
          key={partner.id}
          partner={partner}
          totalFund={totalFund}
          onAddInvestment={onAddInvestment}
          onAddWithdrawal={onAddWithdrawal}
          onAddPayout={onAddPayout}
          onViewLedger={onViewLedger}
          onEdit={onEditPartner}
          onDelete={onDeletePartner}
        />
      ))}
    </div>
  );
}
