'use client';

import { X, Check, Loader2, Percent, Users } from 'lucide-react';
import { Partner } from './types';

export interface PartnerFormData {
  name: string;
  email: string;
  phone: string;
  equityPercentage: string;
  status: string;
  joinedDate: string;
  notes: string;
}

interface PartnerModalProps {
  isOpen: boolean;
  editingPartner: Partner | null;
  formData: PartnerFormData;
  isSubmitting: boolean;
  onClose: () => void;
  onChange: (data: PartnerFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function PartnerModal({
  isOpen,
  editingPartner,
  formData,
  isSubmitting,
  onClose,
  onChange,
  onSubmit,
}: PartnerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[90dvh] flex flex-col">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-muted/30 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-muted text-foreground border border-border">
              <Users size={16} />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {editingPartner ? 'Edit Partner Profile' : 'Add New Partner'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Partner Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={formData.name}
              onChange={(e) => onChange({ ...formData, name: e.target.value })}
              className="w-full min-h-[40px] px-3 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border-hover focus:ring-1 focus:ring-foreground/20 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Email Address</label>
              <input
                type="email"
                placeholder="partner@example.com"
                value={formData.email}
                onChange={(e) => onChange({ ...formData, email: e.target.value })}
                className="w-full min-h-[40px] px-3 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border-hover focus:ring-1 focus:ring-foreground/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Phone Number</label>
              <input
                type="tel"
                placeholder="+91 9876543210"
                value={formData.phone}
                onChange={(e) => onChange({ ...formData, phone: e.target.value })}
                className="w-full min-h-[40px] px-3 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border-hover focus:ring-1 focus:ring-foreground/20 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Equity Share %</label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="e.g. 25"
                  value={formData.equityPercentage}
                  onChange={(e) => onChange({ ...formData, equityPercentage: e.target.value })}
                  className="w-full min-h-[40px] pl-3 pr-8 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border-hover focus:ring-1 focus:ring-foreground/20 transition-colors font-mono"
                />
                <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Partner Status</label>
              <select
                value={formData.status}
                onChange={(e) => onChange({ ...formData, status: e.target.value })}
                className="w-full min-h-[40px] px-3 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-border-hover transition-colors"
              >
                <option value="ACTIVE" className="bg-card text-foreground">ACTIVE</option>
                <option value="INACTIVE" className="bg-card text-foreground">INACTIVE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Joined Date</label>
            <input
              type="date"
              value={formData.joinedDate}
              onChange={(e) => onChange({ ...formData, joinedDate: e.target.value })}
              className="w-full min-h-[40px] px-3 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-border-hover transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Notes / Agreement Details</label>
            <textarea
              rows={2}
              placeholder="Terms, capital agreement details, notes..."
              value={formData.notes}
              onChange={(e) => onChange({ ...formData, notes: e.target.value })}
              className="w-full p-3 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border-hover focus:ring-1 focus:ring-foreground/20 resize-none transition-colors"
            />
          </div>

          <div className="pt-3 border-t border-border flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 min-h-[38px] rounded-lg text-xs font-medium text-foreground bg-muted hover:bg-muted/80 border border-border transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 min-h-[38px] bg-primary text-primary-foreground hover:opacity-90 active:opacity-80 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              <span>{editingPartner ? 'Save Changes' : 'Create Partner'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
