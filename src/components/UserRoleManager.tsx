'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Loader2, 
  Mail, 
  UserCheck, 
  Handshake, 
  ShieldAlert,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ConfirmModal';
import { UserRole } from '@/db/schema';

interface AllowedUser {
  id: string;
  email: string;
  role: UserRole;
  partnerId: string | null;
  partnerName?: string | null;
  createdAt: string;
}

interface PartnerOption {
  id: string;
  name: string;
  email?: string | null;
}

const ROLE_CONFIGS: Record<UserRole, { label: string; badge: string; description: string }> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    description: 'Full access to all financial data, partner capital, settings & users',
  },
  ADMIN: {
    label: 'Admin',
    badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    description: 'Operational manager: orders, inventory, revenue, expenses, and ads',
  },
  STAFF: {
    label: 'Staff',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    description: 'Order issues and inventory stock counts (no financial figures)',
  },
  PARTNER: {
    label: 'Partner',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    description: 'Investor view: overview metrics and strictly their own capital & payouts',
  },
  VIEWER: {
    label: 'Viewer',
    badge: 'bg-neutral-500/15 text-neutral-300 border-neutral-500/30',
    description: 'Read-only access across approved non-sensitive overview views',
  },
};

export default function UserRoleManager() {
  const [users, setUsers] = useState<AllowedUser[]>([]);
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Add User Modal / Form State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('STAFF');
  const [newPartnerId, setNewPartnerId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Updating User State
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Delete User State
  const [userToDelete, setUserToDelete] = useState<AllowedUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch team users');
      const data = await res.json();
      setUsers(data.users || []);
      setPartners(data.partners || []);
      setRoles(data.roles || []);
      setCurrentUserEmail(data.currentUserEmail || '');
    } catch (err: unknown) {
      console.error(err);
      toast.error('Error fetching team members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail.trim().toLowerCase(),
          role: newRole,
          partnerId: newRole === 'PARTNER' ? newPartnerId || null : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add user');

      toast.success(`Added ${newEmail} as ${ROLE_CONFIGS[newRole].label}`);
      setNewEmail('');
      setNewRole('STAFF');
      setNewPartnerId('');
      setIsAddOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error adding user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, targetRole: UserRole, partnerId?: string | null) => {
    try {
      setUpdatingUserId(userId);
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: targetRole,
          partnerId: targetRole === 'PARTNER' ? partnerId : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role');

      toast.success('User role updated');
      fetchUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error updating user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove user');

      toast.success(`Removed ${userToDelete.email}`);
      setUserToDelete(null);
      fetchUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error deleting user');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-[#1e1e1e] p-4 sm:p-6 rounded-xl border border-white/10 shadow-sm text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight">Team &amp; Role Management (RBAC)</h2>
            <p className="text-xs sm:text-sm text-neutral-400">
              Control access levels, permissions, and partner-scoped views across the dashboard.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-black text-xs sm:text-sm font-semibold rounded-xl hover:bg-neutral-200 transition-all shadow-sm active:scale-95 shrink-0"
        >
          <Plus size={16} />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-8 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-neutral-400" />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {/* User List Table */}
          <div className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/5 bg-black/30">
            {users.map((u) => {
              const isCurrent = u.email.toLowerCase() === currentUserEmail.toLowerCase();
              const isUpdating = updatingUserId === u.id;
              const roleConfig = ROLE_CONFIGS[u.role] || ROLE_CONFIGS.VIEWER;

              return (
                <div key={u.id} className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                  {/* Left: Email & Status */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center font-semibold text-xs text-white uppercase shrink-0">
                      {u.email.substring(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white truncate max-w-xs">{u.email}</span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            You
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${roleConfig.badge}`}>
                          {roleConfig.label}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5 truncate max-w-md">
                        {roleConfig.description}
                        {u.role === 'PARTNER' && u.partnerName ? ` • Bound to ${u.partnerName}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Right: Role Selection & Actions */}
                  <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
                    {/* Role Dropdown */}
                    <div className="relative">
                      <select
                        value={u.role}
                        disabled={isUpdating || (isCurrent && u.role === 'SUPER_ADMIN')}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole, u.partnerId)}
                        className="bg-neutral-900 border border-white/15 text-white text-xs rounded-xl px-3 py-1.5 focus:ring-1 focus:ring-purple-500 focus:outline-none appearance-none pr-8 cursor-pointer disabled:opacity-50"
                      >
                        {roles.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_CONFIGS[r]?.label || r}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                    </div>

                    {/* If Partner, choose which partner profile they map to */}
                    {u.role === 'PARTNER' && (
                      <div className="relative">
                        <select
                          value={u.partnerId || ''}
                          disabled={isUpdating}
                          onChange={(e) => handleRoleChange(u.id, 'PARTNER', e.target.value || null)}
                          className="bg-neutral-900 border border-amber-500/30 text-amber-300 text-xs rounded-xl px-3 py-1.5 focus:ring-1 focus:ring-amber-500 focus:outline-none appearance-none pr-8 cursor-pointer"
                        >
                          <option value="">Unlinked Partner</option>
                          {partners.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none" />
                      </div>
                    )}

                    {/* Delete button (cannot delete yourself) */}
                    {!isCurrent && (
                      <button
                        onClick={() => setUserToDelete(u)}
                        className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors border border-transparent hover:border-red-500/20"
                        title="Remove user"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">Invite Team Member</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Add a Google account email and assign appropriate dashboard permissions.
            </p>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="email"
                    required
                    placeholder="user@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Assigned Role</label>
                <div className="grid grid-cols-1 gap-2">
                  {roles.map((r) => {
                    const cfg = ROLE_CONFIGS[r];
                    const isSelected = newRole === r;
                    return (
                      <div
                        key={r}
                        onClick={() => setNewRole(r)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-purple-500/10 border-purple-500/40 text-white'
                            : 'bg-neutral-950 border-white/5 text-neutral-400 hover:border-white/15'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{cfg.label}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                            {r}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-1">{cfg.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {newRole === 'PARTNER' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Link to Partner Record (Optional)
                  </label>
                  <select
                    value={newPartnerId}
                    onChange={(e) => setNewPartnerId(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="">No Partner Link (Generic Partner View)</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.email ? `(${p.email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-white text-black text-xs font-bold rounded-xl hover:bg-neutral-200 transition-all shadow-md disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  <span>Save Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation */}
      <ConfirmModal
        isOpen={!!userToDelete}
        title="Revoke User Access"
        message={`Are you sure you want to remove ${userToDelete?.email} from the allowed users list? They will immediately lose access to the dashboard.`}
        confirmText="Revoke Access"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setUserToDelete(null)}
      />
    </div>
  );
}
