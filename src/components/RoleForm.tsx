'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Loader2, 
  Check, 
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ConfirmModal';
import { PERMISSION_CATALOG, ROLE_COLOR_PALETTES, PermissionItem } from '@/lib/rbac';

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

export interface RoleInitialData {
  id?: string;
  name?: string;
  code?: string;
  description?: string;
  color?: string;
  permissions?: string[];
  isSystem?: boolean;
}

export default function RoleForm({
  initialData,
  isEdit = false,
}: {
  initialData?: RoleInitialData;
  isEdit?: boolean;
}) {
  const router = useRouter();

  const [roleName, setRoleName] = useState(initialData?.name || '');
  const [roleCode, setRoleCode] = useState(initialData?.code || '');
  const [roleDescription, setRoleDescription] = useState(initialData?.description || '');
  const [roleColor, setRoleColor] = useState(initialData?.color || 'blue');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(initialData?.permissions || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state for edit mode
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const permissionsByCategory = PERMISSION_CATALOG.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PermissionItem[]>);

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

  const handleSelectAll = () => {
    if (selectedPermissions.length === PERMISSION_CATALOG.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(PERMISSION_CATALOG.map((p) => p.key));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      toast.error('Role name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEdit && initialData?.id) {
        // Edit existing custom role
        const res = await fetch(`/api/roles/${initialData.id}`, {
          method: 'PATCH',
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

        toast.success(`Updated role ${roleName}`);
        router.push('/team');
        router.refresh();
      } else {
        // Create new custom role
        const res = await fetch('/api/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: roleName.trim(),
            code: roleCode.trim().toUpperCase(),
            description: roleDescription.trim(),
            color: roleColor,
            permissions: selectedPermissions,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create role');

        toast.success(`Created role ${roleName}`);
        router.push('/team');
        router.refresh();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error saving role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!initialData?.id) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/roles/${initialData.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete role');

      toast.success('Role deleted');
      router.push('/team');
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error deleting role');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const previewBadgeStyle = ROLE_COLOR_PALETTES[roleColor]?.badge || ROLE_COLOR_PALETTES.blue.badge;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 text-foreground">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/team"
            className="p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-xs"
            title="Back to Team & Roles"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-muted border border-border text-foreground">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {isEdit ? `Edit Role: ${initialData?.name}` : 'Create Custom Role'}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Configure role identity, visual badge styling, and module-level feature permissions.
              </p>
            </div>
          </div>
        </div>

        {/* Live Badge Preview */}
        <div className="bg-card border border-border rounded-lg px-3.5 py-2 flex items-center gap-2.5 self-start sm:self-auto shadow-xs">
          <span className="text-xs text-muted-foreground font-medium">Badge Preview:</span>
          <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${previewBadgeStyle}`}>
            {roleName.trim() || 'Role Name'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* CARD 1: Basic Role Details */}
        <div className="bg-card p-5 sm:p-6 rounded-xl border border-border shadow-xs space-y-5">
          <div className="pb-3 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">1. Role Information</h2>
            <p className="text-xs text-muted-foreground">
              Set the public name, unique internal code, and description for this role.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Role Name */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Role Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Warehouse Lead"
                value={roleName}
                onChange={(e) => {
                  setRoleName(e.target.value);
                  if (!isEdit && !roleCode) {
                    setRoleCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '_'));
                  }
                }}
                className="w-full bg-muted/40 border border-input rounded-lg px-3.5 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Role Code */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Role Code {isEdit ? '(Immutable)' : '*'}
              </label>
              <input
                type="text"
                required
                disabled={isEdit}
                placeholder="e.g. WAREHOUSE_LEAD"
                value={roleCode}
                onChange={(e) => setRoleCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
                className="w-full bg-muted/40 border border-input rounded-lg px-3.5 py-2 text-sm text-foreground font-mono uppercase placeholder-muted-foreground focus:outline-none focus:border-primary disabled:opacity-50 transition-colors"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label>
            <input
              type="text"
              placeholder="e.g. Handles product inventory, stock sync, and resolves order issues"
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              className="w-full bg-muted/40 border border-input rounded-lg px-3.5 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Color Palette Selector */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Badge Color Palette</label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_CHOICES.map((c) => {
                const isSelected = roleColor === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setRoleColor(c.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      isSelected
                        ? 'border-primary bg-muted text-foreground ring-1 ring-primary'
                        : 'border-border bg-card text-muted-foreground hover:border-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${c.bg}`} />
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* CARD 2: Module Permissions */}
        <div className="bg-card p-5 sm:p-6 rounded-xl border border-border shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div>
              <h2 className="text-base font-semibold text-foreground">2. Module Permissions</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Toggle access rights across individual dashboard views and functional capabilities ({selectedPermissions.length} of {PERMISSION_CATALOG.length} granted).
              </p>
            </div>

            <button
              type="button"
              onClick={handleSelectAll}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-border bg-muted text-xs font-semibold text-foreground hover:bg-accent transition-colors shrink-0"
            >
              {selectedPermissions.length === PERMISSION_CATALOG.length ? 'Deselect All' : 'Grant All Permissions'}
            </button>
          </div>

          {/* Permissions Grouped Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(permissionsByCategory).map(([category, items]) => {
              const allCatSelected = items.every((i) => selectedPermissions.includes(i.key));
              const someCatSelected = items.some((i) => selectedPermissions.includes(i.key));

              return (
                <div key={category} className="rounded-xl border border-border bg-muted/30 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2.5 border-b border-border mb-3">
                      <span className="text-xs font-semibold text-foreground uppercase tracking-wider">{category}</span>
                      <button
                        type="button"
                        onClick={() => toggleCategoryPermissions(items)}
                        className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {allCatSelected ? 'Clear Module' : someCatSelected ? 'Select All in Module' : 'Select All'}
                      </button>
                    </div>

                    <div className="space-y-2">
                      {items.map((item) => {
                        const isChecked = selectedPermissions.includes(item.key);
                        return (
                          <div
                            key={item.key}
                            onClick={() => togglePermission(item.key)}
                            className={`p-2.5 rounded-lg border cursor-pointer transition-colors flex items-start gap-3 ${
                              isChecked
                                ? 'bg-card border-primary/40 text-foreground shadow-xs'
                                : 'bg-card/50 border-border text-muted-foreground hover:border-muted-foreground/60'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border shrink-0 transition-colors ${
                                isChecked
                                  ? 'bg-primary border-primary text-primary-foreground'
                                  : 'border-border bg-muted'
                              }`}
                            >
                              {isChecked && <Check size={12} strokeWidth={3} />}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-foreground">{item.label}</div>
                              <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                {item.description}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="bg-card/95 backdrop-blur-md p-4 rounded-xl border border-border flex items-center justify-between gap-4 shadow-xl sticky bottom-4 z-20">
          <div>
            {isEdit && !initialData?.isSystem && (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
              >
                <Trash2 size={15} />
                <span>Delete Role</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/team"
              className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-primary text-primary-foreground text-xs sm:text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 shadow-xs"
            >
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              <span>{isEdit ? 'Save Changes' : 'Create Role'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Delete Role Modal */}
      {isEdit && (
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          title={`Delete Role: ${initialData?.name}`}
          message={`Are you sure you want to delete the custom role '${initialData?.name}'? Any assigned members will need to be assigned to another role.`}
          confirmText="Delete Role"
          isLoading={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      )}
    </div>
  );
}
