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
  onViewLedger,
  onEditPartner,
  onDeletePartner,
}: PartnersOverviewTabProps) {
  if (partners.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-neutral-400 mb-4">
          <Users size={22} />
        </div>
        <h3 className="text-base font-semibold text-white">No partners found</h3>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-md mx-auto">
          {searchQuery
            ? 'No partners match your search query.'
            : 'Start by registering business partners to manage their invested capital, equity allocations, and drawings.'}
        </p>
        {!searchQuery && (
          <button
            onClick={onOpenAddPartner}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-semibold rounded-xl transition-all shadow-sm"
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
          onViewLedger={onViewLedger}
          onEdit={onEditPartner}
          onDelete={onDeletePartner}
        />
      ))}
    </div>
  );
}
