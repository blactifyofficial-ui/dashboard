'use client';

import { X, Check, Loader2, Percent } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/30">
          <h3 className="text-lg font-bold text-white">
            {editingPartner ? 'Edit Partner Profile' : 'Add New Partner'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">
              Partner Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={formData.name}
              onChange={(e) => onChange({ ...formData, name: e.target.value })}
              className="w-full h-10 px-3.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">Email Address</label>
              <input
                type="email"
                placeholder="partner@example.com"
                value={formData.email}
                onChange={(e) => onChange({ ...formData, email: e.target.value })}
                className="w-full h-10 px-3.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">Phone Number</label>
              <input
                type="tel"
                placeholder="+91 9876543210"
                value={formData.phone}
                onChange={(e) => onChange({ ...formData, phone: e.target.value })}
                className="w-full h-10 px-3.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">Equity Share %</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="e.g. 25"
                  value={formData.equityPercentage}
                  onChange={(e) => onChange({ ...formData, equityPercentage: e.target.value })}
                  className="w-full h-10 pl-3.5 pr-8 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 transition-colors"
                />
                <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">Partner Status</label>
              <select
                value={formData.status}
                onChange={(e) => onChange({ ...formData, status: e.target.value })}
                className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/25 transition-colors"
              >
                <option value="ACTIVE" className="bg-neutral-900 text-white">ACTIVE</option>
                <option value="INACTIVE" className="bg-neutral-900 text-white">INACTIVE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">Joined Date</label>
            <input
              type="date"
              value={formData.joinedDate}
              onChange={(e) => onChange({ ...formData, joinedDate: e.target.value })}
              className="w-full h-10 px-3.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/25 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">Notes / Agreement Details</label>
            <textarea
              rows={2}
              placeholder="Terms, capital agreement details, notes..."
              value={formData.notes}
              onChange={(e) => onChange({ ...formData, notes: e.target.value })}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 resize-none transition-colors"
            />
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-white text-black hover:bg-neutral-200 text-sm font-medium rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              <span>{editingPartner ? 'Save Changes' : 'Create Partner'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
