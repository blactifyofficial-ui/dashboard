'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Users, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Loader2, 
  Mail, 
  ChevronDown,
  Edit2,
  Info,
  Lock,
  Send
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ConfirmModal';
import { UserRole } from '@/db/schema';
import { PERMISSION_CATALOG, ROLE_COLOR_PALETTES } from '@/lib/rbac';

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

interface RoleRecord {
  id: string;
  code: string;
  name: string;
  description: string;
  permissions: string[];
  color: string;
  isSystem: boolean;
  userCount: number;
}

export default function UserRoleManager() {
  const [activeTab, setActiveTab] = useState<'members' | 'roles'>('members');
  const [users, setUsers] = useState<AllowedUser[]>([]);
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [systemRoles, setSystemRoles] = useState<RoleRecord[]>([]);
  const [customRolesList, setCustomRolesList] = useState<RoleRecord[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Add User Modal State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<string>('STAFF');
  const [newPartnerId, setNewPartnerId] = useState('');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Updating User State
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [resendingInviteUserId, setResendingInviteUserId] = useState<string | null>(null);

  // Delete User State
  const [userToDelete, setUserToDelete] = useState<AllowedUser | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Delete Role State
  const [roleToDelete, setRoleToDelete] = useState<RoleRecord | null>(null);
  const [isDeletingRole, setIsDeletingRole] = useState(false);

  const fetchRolesAndUsers = useCallback(async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/roles'),
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
        setPartners(data.partners || []);
        setCurrentUserEmail(data.currentUserEmail || '');
      }

      if (rolesRes.ok) {
        const data = await rolesRes.json();
        setSystemRoles(data.systemRoles || []);
        setCustomRolesList(data.customRoles || []);
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error('Error fetching team & roles data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRolesAndUsers();
  }, [fetchRolesAndUsers]);

  // Combined roles list
  const allRoles = [...systemRoles, ...customRolesList];

  const getRoleBadgeStyle = (colorKey: string) => {
    const palette = ROLE_COLOR_PALETTES[colorKey] || ROLE_COLOR_PALETTES.neutral;
    return palette.badge;
  };

  const getRoleConfig = (roleCodeStr: string) => {
    const found = allRoles.find((r) => r.code === roleCodeStr);
    if (found) {
      return {
        label: found.name,
        badge: getRoleBadgeStyle(found.color),
        description: found.description,
        color: found.color,
        isSystem: found.isSystem,
      };
    }
    return {
      label: roleCodeStr,
      badge: getRoleBadgeStyle('neutral'),
      description: '',
      color: 'neutral',
      isSystem: false,
    };
  };

  // -------------------------------------------------------------
  // USER MANAGEMENT HANDLERS
  // -------------------------------------------------------------
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setIsSubmittingUser(true);
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

      toast.success(`Added ${newEmail}`);
      setNewEmail('');
      setNewRole('STAFF');
      setNewPartnerId('');
      setIsAddUserOpen(false);
      fetchRolesAndUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error adding user');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleRoleChange = async (userId: string, targetRole: string, partnerId?: string | null) => {
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
      fetchRolesAndUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error updating user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setIsDeletingUser(true);
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove user');

      toast.success(`Removed ${userToDelete.email}`);
      setUserToDelete(null);
      fetchRolesAndUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error deleting user');
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleResendInvite = async (user: AllowedUser) => {
    try {
      setResendingInviteUserId(user.id);
      const res = await fetch(`/api/users/${user.id}/resend-invite`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send invite');

      toast.success(`Invitation email sent to ${user.email}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error sending invitation');
    } finally {
      setResendingInviteUserId(null);
    }
  };

  // -------------------------------------------------------------
  // CUSTOM ROLE HANDLERS
  // -------------------------------------------------------------
  const handleConfirmDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      setIsDeletingRole(true);
      const res = await fetch(`/api/roles/${roleToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete role');

      toast.success(data.message || 'Role deleted');
      setRoleToDelete(null);
      fetchRolesAndUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error deleting role');
    } finally {
      setIsDeletingRole(false);
    }
  };

  return (
    <div className="bg-neutral-900/60 p-4 sm:p-6 rounded-xl border border-neutral-800 shadow-sm text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300">
            <Users size={18} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold tracking-tight">Team &amp; Role Management</h2>
            <p className="text-xs sm:text-sm text-neutral-400">
              Invite team members, assign permission tiers, and create custom dashboard roles.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Link
            href="/team/roles/new"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs sm:text-sm font-medium rounded-lg hover:bg-neutral-700 transition-colors shrink-0"
          >
            <ShieldCheck size={15} className="text-neutral-300" />
            <span>+ Add Role</span>
          </Link>
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white text-black text-xs sm:text-sm font-semibold rounded-lg hover:bg-neutral-200 transition-colors shrink-0"
          >
            <Plus size={15} />
            <span>Invite Member</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mt-4 border-b border-neutral-800 pb-2">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            activeTab === 'members'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
          }`}
        >
          <Users size={15} />
          <span>Team Members ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            activeTab === 'roles'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
          }`}
        >
          <ShieldCheck size={15} />
          <span>Roles &amp; Permissions ({allRoles.length})</span>
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-12 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-neutral-400" />
        </div>
      ) : activeTab === 'members' ? (
        /* ========================================================= */
        /* TAB 1: TEAM MEMBERS LIST */
        /* ========================================================= */
        <div className="mt-4 space-y-3">
          <div className="divide-y divide-neutral-800 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950/40">
            {users.map((u) => {
              const isCurrent = u.email.toLowerCase() === currentUserEmail.toLowerCase();
              const isUpdating = updatingUserId === u.id;
              const roleConfig = getRoleConfig(u.role);

              return (
                <div key={u.id} className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-neutral-900/40 transition-colors">
                  {/* Left: Email & Role Badge */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-semibold text-xs text-neutral-200 uppercase shrink-0">
                      {u.email.substring(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-white truncate max-w-xs">{u.email}</span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            You
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${roleConfig.badge}`}>
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
                        onChange={(e) => handleRoleChange(u.id, e.target.value, u.partnerId)}
                        className="bg-neutral-950 border border-neutral-800 text-white text-xs rounded-lg px-3 py-1.5 focus:border-neutral-500 focus:outline-none appearance-none pr-8 cursor-pointer disabled:opacity-50"
                      >
                        <optgroup label="System Roles">
                          {systemRoles.map((r) => (
                            <option key={r.code} value={r.code}>
                              {r.name}
                            </option>
                          ))}
                        </optgroup>
                        {customRolesList.length > 0 && (
                          <optgroup label="Custom Roles">
                            {customRolesList.map((r) => (
                              <option key={r.code} value={r.code}>
                                {r.name}
                              </option>
                            ))}
                          </optgroup>
                        )}
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
                          className="bg-neutral-950 border border-amber-500/30 text-amber-300 text-xs rounded-lg px-3 py-1.5 focus:border-amber-500 focus:outline-none appearance-none pr-8 cursor-pointer"
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

                    {/* Resend Invite Email button */}
                    <button
                      onClick={() => handleResendInvite(u)}
                      disabled={resendingInviteUserId === u.id}
                      className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors border border-transparent disabled:opacity-50"
                      title="Resend invitation email"
                    >
                      {resendingInviteUserId === u.id ? (
                        <Loader2 size={15} className="animate-spin text-neutral-400" />
                      ) : (
                        <Send size={15} />
                      )}
                    </button>

                    {/* Delete button (cannot delete yourself) */}
                    {!isCurrent && (
                      <button
                        onClick={() => setUserToDelete(u)}
                        className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
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
      ) : (
        /* ========================================================= */
        /* TAB 2: ROLES & PERMISSIONS */
        /* ========================================================= */
        <div className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-neutral-950/60 border border-neutral-800">
            <div className="flex items-start gap-2.5 text-xs text-neutral-300">
              <Info size={16} className="text-neutral-400 shrink-0 mt-0.5" />
              <span>
                Create custom roles to grant tailored access levels (e.g. Warehouse Staff, Media Buyers, Accountants) without exposing restricted financial records.
              </span>
            </div>
            <Link
              href="/team/roles/new"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white text-black text-xs font-semibold rounded-lg hover:bg-neutral-200 transition-colors shrink-0"
            >
              <Plus size={14} />
              <span>Create New Role</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allRoles.map((role) => {
              const badgeStyle = getRoleBadgeStyle(role.color);
              const isSuper = role.code === 'SUPER_ADMIN';

              return (
                <div
                  key={role.code}
                  className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:border-neutral-700 transition-colors relative group"
                >
                  <div>
                    {/* Top Row: Title, Badge, and Action Buttons */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-semibold text-white">{role.name}</h3>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${badgeStyle}`}>
                            {role.code}
                          </span>
                          {role.isSystem ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-neutral-400 bg-neutral-800/80 px-2 py-0.5 rounded-md border border-neutral-700">
                              <Lock size={10} /> System Default
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] text-neutral-300 bg-neutral-800 px-2 py-0.5 rounded-md border border-neutral-700 font-medium">
                              Custom Role
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 mt-1">{role.description || 'No description provided.'}</p>
                      </div>

                      {/* Custom Role Actions (Edit page / Delete) */}
                      {!role.isSystem && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Link
                            href={`/team/roles/${role.id}`}
                            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors inline-flex items-center justify-center"
                            title="Edit Role & Permissions"
                          >
                            <Edit2 size={14} />
                          </Link>
                          <button
                            onClick={() => setRoleToDelete(role)}
                            className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Delete Custom Role"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Permissions summary */}
                    <div className="mt-3 pt-3 border-t border-neutral-800 text-xs">
                      <div className="flex items-center justify-between text-neutral-400 mb-2">
                        <span className="font-medium text-neutral-300">
                          {isSuper ? 'All System Permissions (*)' : `${role.permissions.length} Permissions Enabled`}
                        </span>
                        <span>{role.userCount} Active Member{role.userCount === 1 ? '' : 's'}</span>
                      </div>

                      {!isSuper && role.permissions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                          {role.permissions.slice(0, 8).map((pKey) => {
                            const def = PERMISSION_CATALOG.find((item) => item.key === pKey);
                            return (
                              <span
                                key={pKey}
                                className="px-2 py-0.5 rounded-md bg-neutral-800/70 border border-neutral-700 text-[10px] text-neutral-300 truncate"
                                title={def?.description || pKey}
                              >
                                {def?.label || pKey}
                              </span>
                            );
                          })}
                          {role.permissions.length > 8 && (
                            <span className="px-2 py-0.5 rounded-md bg-neutral-800/70 border border-neutral-700 text-[10px] text-neutral-400">
                              +{role.permissions.length - 8} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: INVITE TEAM MEMBER */}
      {/* ========================================================= */}
      {isAddUserOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md p-5 sm:p-6 shadow-2xl relative">
            <h3 className="text-base font-semibold text-white mb-1">Invite Team Member</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Add a Google account email and assign appropriate dashboard permissions.
            </p>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="email"
                    required
                    placeholder="user@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">Assigned Role</label>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                  {allRoles.map((r) => {
                    const cfg = getRoleConfig(r.code);
                    const isSelected = newRole === r.code;
                    return (
                      <div
                        key={r.code}
                        onClick={() => setNewRole(r.code)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-neutral-800 border-neutral-600 text-white'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white">{cfg.label}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md border ${cfg.badge}`}>
                            {r.code}
                          </span>
                        </div>
                        {cfg.description && (
                          <p className="text-[11px] text-neutral-400 mt-1">{cfg.description}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {newRole === 'PARTNER' && (
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Link to Partner Record (Optional)
                  </label>
                  <select
                    value={newPartnerId}
                    onChange={(e) => setNewPartnerId(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-500"
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

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-black text-xs font-semibold rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50"
                >
                  {isSubmittingUser && <Loader2 size={14} className="animate-spin" />}
                  <span>Save Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DELETE CONFIRMATIONS */}
      {/* ========================================================= */}
      {/* Delete User Confirmation */}
      <ConfirmModal
        isOpen={!!userToDelete}
        title="Revoke User Access"
        message={`Are you sure you want to remove ${userToDelete?.email} from the allowed users list? They will immediately lose access to the dashboard.`}
        confirmText="Revoke Access"
        isLoading={isDeletingUser}
        onConfirm={handleConfirmDeleteUser}
        onCancel={() => setUserToDelete(null)}
      />

      {/* Delete Custom Role Confirmation */}
      <ConfirmModal
        isOpen={!!roleToDelete}
        title={`Delete Role: ${roleToDelete?.name}`}
        message={`Are you sure you want to delete the role '${roleToDelete?.name}' (${roleToDelete?.code})? This action cannot be undone.`}
        confirmText="Delete Role"
        isLoading={isDeletingRole}
        onConfirm={handleConfirmDeleteRole}
        onCancel={() => setRoleToDelete(null)}
      />
    </div>
  );
}
