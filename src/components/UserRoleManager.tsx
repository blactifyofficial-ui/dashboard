'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Loader2, 
  Mail, 
  ChevronDown,
  Edit2,
  Check,
  Sparkles,
  Info,
  Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ConfirmModal';
import { UserRole } from '@/db/schema';
import { PERMISSION_CATALOG, ROLE_COLOR_PALETTES, PermissionItem } from '@/lib/rbac';

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

const COLOR_CHOICES = [
  { id: 'purple', name: 'Purple', bg: 'bg-purple-500', border: 'border-purple-500' },
  { id: 'blue', name: 'Blue', bg: 'bg-blue-500', border: 'border-blue-500' },
  { id: 'emerald', name: 'Emerald', bg: 'bg-emerald-500', border: 'border-emerald-500' },
  { id: 'amber', name: 'Amber', bg: 'bg-amber-500', border: 'border-amber-500' },
  { id: 'rose', name: 'Rose', bg: 'bg-rose-500', border: 'border-rose-500' },
  { id: 'cyan', name: 'Cyan', bg: 'bg-cyan-500', border: 'border-cyan-500' },
  { id: 'indigo', name: 'Indigo', bg: 'bg-indigo-500', border: 'border-indigo-500' },
  { id: 'neutral', name: 'Neutral', bg: 'bg-neutral-500', border: 'border-neutral-500' },
];

export default function UserRoleManager() {
  const [activeTab, setActiveTab] = useState<'members' | 'roles'>('members');
  const [users, setUsers] = useState<AllowedUser[]>([]);
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [systemRoles, setSystemRoles] = useState<RoleRecord[]>([]);
  const [customRolesList, setCustomRolesList] = useState<RoleRecord[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Add User Modal / Form State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<string>('STAFF');
  const [newPartnerId, setNewPartnerId] = useState('');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Updating User State
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Delete User State
  const [userToDelete, setUserToDelete] = useState<AllowedUser | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Role Create / Edit Modal State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleCode, setRoleCode] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [roleColor, setRoleColor] = useState('blue');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);

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

  // -------------------------------------------------------------
  // CUSTOM ROLE HANDLERS
  // -------------------------------------------------------------
  const openCreateRoleModal = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleCode('');
    setRoleDescription('');
    setRoleColor('blue');
    setSelectedPermissions([]);
    setIsRoleModalOpen(true);
  };

  const openEditRoleModal = (role: RoleRecord) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleCode(role.code);
    setRoleDescription(role.description || '');
    setRoleColor(role.color || 'blue');
    setSelectedPermissions(role.permissions || []);
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      toast.error('Role name is required');
      return;
    }

    try {
      setIsSubmittingRole(true);
      if (editingRole) {
        // Edit existing custom role
        const res = await fetch(`/api/roles/${editingRole.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: roleName.trim(),
            description: roleDescription.trim(),
            color: roleColor,
            permissions: selectedPermissions,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update role');

        toast.success(`Updated role '${roleName}'`);
      } else {
        // Create new role
        const res = await fetch('/api/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: roleName.trim(),
            code: roleCode.trim() || undefined,
            description: roleDescription.trim(),
            color: roleColor,
            permissions: selectedPermissions,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create role');

        toast.success(`Created role '${roleName}'`);
      }

      setIsRoleModalOpen(false);
      fetchRolesAndUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error saving role');
    } finally {
      setIsSubmittingRole(false);
    }
  };

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

  const togglePermission = (permKey: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permKey) ? prev.filter((k) => k !== permKey) : [...prev, permKey]
    );
  };

  const toggleCategoryPermissions = (items: PermissionItem[]) => {
    const keys = items.map((i) => i.key);
    const allSelected = keys.every((k) => selectedPermissions.includes(k));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((k) => !keys.includes(k as never)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...keys])));
    }
  };

  // Group permissions by category
  const permissionsByCategory = PERMISSION_CATALOG.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PermissionItem[]>);

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
              Invite team members, assign permission tiers, and create custom dashboard roles.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={openCreateRoleModal}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-neutral-900 border border-white/15 text-white text-xs sm:text-sm font-medium rounded-xl hover:bg-neutral-800 transition-all shadow-sm active:scale-95 shrink-0"
          >
            <ShieldCheck size={16} className="text-purple-400" />
            <span>+ Add Role</span>
          </button>
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white text-black text-xs sm:text-sm font-semibold rounded-xl hover:bg-neutral-200 transition-all shadow-sm active:scale-95 shrink-0"
          >
            <Plus size={16} />
            <span>Invite Member</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mt-4 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            activeTab === 'members'
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
          }`}
        >
          <Users size={15} />
          <span>Team Members ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            activeTab === 'roles'
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
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
          <div className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/5 bg-black/30">
            {users.map((u) => {
              const isCurrent = u.email.toLowerCase() === currentUserEmail.toLowerCase();
              const isUpdating = updatingUserId === u.id;
              const roleConfig = getRoleConfig(u.role);

              return (
                <div key={u.id} className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                  {/* Left: Email & Role Badge */}
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
                        onChange={(e) => handleRoleChange(u.id, e.target.value, u.partnerId)}
                        className="bg-neutral-900 border border-white/15 text-white text-xs rounded-xl px-3 py-1.5 focus:ring-1 focus:ring-purple-500 focus:outline-none appearance-none pr-8 cursor-pointer disabled:opacity-50"
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
      ) : (
        /* ========================================================= */
        /* TAB 2: ROLES & PERMISSIONS */
        /* ========================================================= */
        <div className="mt-4 space-y-4">
          <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/20 flex items-start gap-2.5 text-xs text-neutral-300">
            <Info size={16} className="text-purple-400 shrink-0 mt-0.5" />
            <span>
              Create custom roles to grant tailored access levels (e.g. Warehouse Staff, Media Buyers, Accountants) without exposing restricted financial records.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allRoles.map((role) => {
              const badgeStyle = getRoleBadgeStyle(role.color);
              const isSuper = role.code === 'SUPER_ADMIN';

              return (
                <div
                  key={role.code}
                  className="bg-neutral-950/60 border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:border-white/20 transition-all shadow-sm relative group"
                >
                  <div>
                    {/* Top Row: Title, Badge, and Action Buttons */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-bold text-white">{role.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeStyle}`}>
                            {role.code}
                          </span>
                          {role.isSystem ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-neutral-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                              <Lock size={10} /> System Default
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                              <Sparkles size={10} /> Custom Role
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 mt-1">{role.description || 'No description provided.'}</p>
                      </div>

                      {/* Custom Role Actions (Edit/Delete) */}
                      {!role.isSystem && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openEditRoleModal(role)}
                            className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Edit Role & Permissions"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setRoleToDelete(role)}
                            className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete Custom Role"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Permissions summary */}
                    <div className="mt-3 pt-3 border-t border-white/5 text-xs">
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
                                className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-neutral-300 truncate"
                                title={def?.description || pKey}
                              >
                                {def?.label || pKey}
                              </span>
                            );
                          })}
                          {role.permissions.length > 8 && (
                            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-neutral-400">
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
      {/* MODAL 1: CREATE / EDIT CUSTOM ROLE */}
      {/* ========================================================= */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative my-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 pb-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingRole ? `Edit Role: ${editingRole.name}` : 'Create Custom Role'}
                </h3>
                <p className="text-xs text-neutral-400">
                  Configure role identifier, badge styling, and granular feature permissions.
                </p>
              </div>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Body / Scrollable Form */}
            <form onSubmit={handleSaveRole} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Role Name */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Role Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Warehouse Lead"
                    value={roleName}
                    onChange={(e) => {
                      setRoleName(e.target.value);
                      if (!editingRole && !roleCode) {
                        setRoleCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '_'));
                      }
                    }}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>

                {/* Role Code */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Role Code {editingRole ? '(Read-only)' : '*'}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingRole}
                    placeholder="e.g. WAREHOUSE_LEAD"
                    value={roleCode}
                    onChange={(e) => setRoleCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Handles product inventory, stock sync, and resolves order issues"
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              {/* Color Palette Selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2">Badge Color Palette</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_CHOICES.map((c) => {
                    const isSelected = roleColor === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setRoleColor(c.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                          isSelected
                            ? `${c.border} bg-white/10 text-white ring-1 ring-white/30`
                            : 'border-white/10 bg-neutral-950 text-neutral-400 hover:border-white/20'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${c.bg}`} />
                        <span>{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Granular Permissions Section */}
              <div className="pt-3 border-t border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-xs font-bold text-white uppercase tracking-wider">
                      Module Permissions
                    </label>
                    <span className="text-[11px] text-neutral-400">
                      Select which specific pages and actions members with this role can access ({selectedPermissions.length} selected).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedPermissions.length === PERMISSION_CATALOG.length) {
                        setSelectedPermissions([]);
                      } else {
                        setSelectedPermissions(PERMISSION_CATALOG.map((p) => p.key));
                      }
                    }}
                    className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 hover:underline shrink-0"
                  >
                    {selectedPermissions.length === PERMISSION_CATALOG.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                  {Object.entries(permissionsByCategory).map(([category, items]) => {
                    const allCatSelected = items.every((i) => selectedPermissions.includes(i.key));
                    const someCatSelected = items.some((i) => selectedPermissions.includes(i.key));

                    return (
                      <div key={category} className="rounded-xl border border-white/5 bg-black/40 p-3.5">
                        <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-2.5">
                          <span className="text-xs font-bold text-neutral-200">{category}</span>
                          <button
                            type="button"
                            onClick={() => toggleCategoryPermissions(items)}
                            className="text-[10px] text-neutral-400 hover:text-white"
                          >
                            {allCatSelected ? 'Clear Category' : someCatSelected ? 'Select All in Category' : 'Select All'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {items.map((item) => {
                            const isChecked = selectedPermissions.includes(item.key);
                            return (
                              <div
                                key={item.key}
                                onClick={() => togglePermission(item.key)}
                                className={`p-2 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${
                                  isChecked
                                    ? 'bg-purple-500/10 border-purple-500/30 text-white'
                                    : 'bg-neutral-950/40 border-white/5 text-neutral-400 hover:border-white/15'
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border shrink-0 ${
                                    isChecked
                                      ? 'bg-purple-500 border-purple-400 text-white'
                                      : 'border-white/20 bg-neutral-900'
                                  }`}
                                >
                                  {isChecked && <Check size={12} strokeWidth={3} />}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-neutral-200">{item.label}</div>
                                  <div className="text-[10px] text-neutral-400 mt-0.5 leading-tight">
                                    {item.description}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRole}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-white text-black text-xs font-bold rounded-xl hover:bg-neutral-200 transition-all shadow-md disabled:opacity-50"
                >
                  {isSubmittingRole && <Loader2 size={14} className="animate-spin" />}
                  <span>{editingRole ? 'Save Changes' : 'Create Role'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: INVITE TEAM MEMBER */}
      {/* ========================================================= */}
      {isAddUserOpen && (
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
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                  {allRoles.map((r) => {
                    const cfg = getRoleConfig(r.code);
                    const isSelected = newRole === r.code;
                    return (
                      <div
                        key={r.code}
                        onClick={() => setNewRole(r.code)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-purple-500/10 border-purple-500/40 text-white'
                            : 'bg-neutral-950 border-white/5 text-neutral-400 hover:border-white/15'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{cfg.label}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${cfg.badge}`}>
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
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-white text-black text-xs font-bold rounded-xl hover:bg-neutral-200 transition-all shadow-md disabled:opacity-50"
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
