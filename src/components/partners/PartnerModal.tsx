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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[90dvh] flex flex-col">
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-neutral-800 text-neutral-300 border border-neutral-700">
              <Users size={16} />
            </div>
            <h3 className="text-base font-semibold text-white">
              {editingPartner ? 'Edit Partner Profile' : 'Add New Partner'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Partner Full Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={formData.name}
              onChange={(e) => onChange({ ...formData, name: e.target.value })}
              className="w-full min-h-[40px] px-3 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">Email Address</label>
              <input
                type="email"
                placeholder="partner@example.com"
                value={formData.email}
                onChange={(e) => onChange({ ...formData, email: e.target.value })}
                className="w-full min-h-[40px] px-3 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">Phone Number</label>
              <input
                type="tel"
                placeholder="+91 9876543210"
                value={formData.phone}
                onChange={(e) => onChange({ ...formData, phone: e.target.value })}
                className="w-full min-h-[40px] px-3 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">Equity Share %</label>
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
                  className="w-full min-h-[40px] pl-3 pr-8 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors font-mono"
                />
                <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">Partner Status</label>
              <select
                value={formData.status}
                onChange={(e) => onChange({ ...formData, status: e.target.value })}
                className="w-full min-h-[40px] px-3 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-neutral-500 transition-colors"
              >
                <option value="ACTIVE" className="bg-neutral-900 text-white">ACTIVE</option>
                <option value="INACTIVE" className="bg-neutral-900 text-white">INACTIVE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">Joined Date</label>
            <input
              type="date"
              value={formData.joinedDate}
              onChange={(e) => onChange({ ...formData, joinedDate: e.target.value })}
              className="w-full min-h-[40px] px-3 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-neutral-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">Notes / Agreement Details</label>
            <textarea
              rows={2}
              placeholder="Terms, capital agreement details, notes..."
              value={formData.notes}
              onChange={(e) => onChange({ ...formData, notes: e.target.value })}
              className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 resize-none transition-colors"
            />
          </div>

          <div className="pt-3 border-t border-neutral-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 min-h-[38px] rounded-lg text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 min-h-[38px] bg-white hover:bg-neutral-200 text-black text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
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
