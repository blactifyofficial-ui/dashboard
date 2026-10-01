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
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/50 mb-4">
          <Users size={22} />
        </div>
        <h3 className="text-base font-semibold text-white">No partners found</h3>
        <p className="text-sm text-white/60 mt-1 max-w-md mx-auto">
          {searchQuery
            ? 'No partners match your search query.'
            : 'Start by adding your business partners to track their invested capital and equity stakes.'}
        </p>
        {!searchQuery && (
          <button
            onClick={onOpenAddPartner}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-white/90 text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>Add First Partner</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
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
