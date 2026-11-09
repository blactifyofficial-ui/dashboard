'use client';

import { useState, useMemo } from 'react';
import { DebtContact, DebtType } from './types';
import { formatCurrency } from './utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  X,
  Plus,
  Users,
  Search,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  Check,
  Loader2,
  FileText,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ManageContactsModalProps {
  open: boolean;
  onClose: () => void;
  contacts: DebtContact[];
  onRefreshContacts: () => void;
  canManage: boolean;
  onSelectContactForDebt?: (contact: DebtContact, type: DebtType) => void;
}

const CATEGORIES = [
  'GENERAL',
  'BUSINESS',
  'PERSONAL',
  'VENDOR',
  'PARTNER',
  'EMERGENCY',
  'OPERATIONAL',
];

export default function ManageContactsModal({
  open,
  onClose,
  contacts,
  onRefreshContacts,
  canManage,
  onSelectContactForDebt,
}: ManageContactsModalProps) {
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState<DebtContact | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setCategory('GENERAL');
    setNotes('');
    setEditingContact(null);
    setShowAddForm(false);
  };

  const startEdit = (c: DebtContact) => {
    setEditingContact(c);
    setName(c.name);
    setCategory(c.category || 'GENERAL');
    setNotes(c.notes || '');
    setShowAddForm(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Person / entity name is required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingContact) {
        // PATCH
        const res = await fetch(`/api/debts/contacts/${editingContact.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            category: category.toUpperCase(),
            notes: notes.trim() || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update contact');
        toast.success(`Updated ${data.contact.name}`);
      } else {
        // POST
        const res = await fetch('/api/debts/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            category: category.toUpperCase(),
            notes: notes.trim() || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to add contact');
        toast.success(`Added ${data.contact.name} to list`);
      }

      resetForm();
      onRefreshContacts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving person';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteContact = async (contact: DebtContact) => {
    if (!confirm(`Are you sure you want to delete ${contact.name}? Any existing debt records will be preserved.`)) {
      return;
    }

    setDeletingId(contact.id);
    try {
      const res = await fetch(`/api/debts/contacts/${contact.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete person');

      toast.success('Person removed from list');
      if (editingContact?.id === contact.id) resetForm();
      onRefreshContacts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting person';
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.category && c.category.toLowerCase().includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q))
    );
  }, [contacts, search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-[20px] shadow-2xl w-full max-w-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Person &amp; Party Directory
              </h2>
              <p className="text-xs text-muted-foreground">
                Manage registered persons to quickly select when lending or borrowing money.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search & + Add Person toggle */}
        <div className="p-4 border-b border-border bg-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or category..."
              className="pl-8.5 pr-8 h-9 text-xs rounded-full bg-card border-border text-foreground"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {canManage && (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (showAddForm) {
                  resetForm();
                } else {
                  resetForm();
                  setShowAddForm(true);
                }
              }}
              className="h-9 px-3.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {showAddForm ? (
                <>
                  <X className="w-3.5 h-3.5 mr-1.5" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add Person
                </>
              )}
            </Button>
          )}
        </div>

        {/* Inline Add / Edit Form */}
        {showAddForm && canManage && (
          <form
            onSubmit={handleSaveContact}
            className="p-4 border-b border-border bg-muted/30 space-y-3 transition-all"
          >
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-primary" />
                {editingContact ? `Edit ${editingContact.name}` : 'New Person Entry'}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Saves to your person directory for quick selection.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-foreground mb-1 block">
                  Full Name / Entity <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Anand Kumar, Apex Agency"
                  className="h-9 text-xs bg-card border-border text-foreground rounded-[9px]"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-foreground mb-1 block">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-card border border-border rounded-[9px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-foreground mb-1 block">
                Notes / Reference (Optional)
              </label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Vendor, partner, friend, operational lender"
                className="h-9 text-xs bg-card border-border text-foreground rounded-[9px]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetForm}
                disabled={submitting}
                className="h-8 px-3 text-xs rounded-full border-border bg-card text-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="h-8 px-4 text-xs font-semibold rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-3 h-3 mr-1.5" />
                    {editingContact ? 'Update Person' : 'Save to List'}
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Contacts List Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
          {filteredContacts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                {search ? 'No persons match your search' : 'No persons in list yet'}
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {search
                  ? 'Try searching with another name.'
                  : 'Add frequent people or entities here to quickly choose them when lending or borrowing money.'}
              </p>
              {!showAddForm && canManage && (
                <Button
                  size="sm"
                  onClick={() => setShowAddForm(true)}
                  className="mt-4 h-8 px-3.5 text-xs rounded-full bg-primary text-primary-foreground"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add First Person
                </Button>
              )}
            </div>
          ) : (
            filteredContacts.map((c) => {
              const net = c.netBalance || 0;
              const hasBalance = Math.abs(net) > 0.01;

              return (
                <div
                  key={c.id}
                  className="p-3.5 rounded-2xl bg-card border border-border hover:border-border/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-foreground truncate">
                        {c.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border/60">
                        {c.category}
                      </span>
                      {hasBalance && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            net > 0
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {net > 0
                            ? `Owes you: ${formatCurrency(net)}`
                            : `You owe: ${formatCurrency(Math.abs(net))}`}
                        </span>
                      )}
                    </div>

                    {c.notes && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <FileText className="w-3 h-3 text-muted-foreground/70" />
                        <span className="italic truncate max-w-sm">{c.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    {onSelectContactForDebt && (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            onClose();
                            onSelectContactForDebt(c, 'LENT');
                          }}
                          className="h-7 px-2.5 text-[11px] font-semibold rounded-full border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20"
                          title={`Lend money to ${c.name}`}
                        >
                          <ArrowUpRight className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" />
                          Lend
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            onClose();
                            onSelectContactForDebt(c, 'BORROWED');
                          }}
                          className="h-7 px-2.5 text-[11px] font-semibold rounded-full border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20"
                          title={`Borrow money from ${c.name}`}
                        >
                          <ArrowDownLeft className="w-3 h-3 mr-1 text-amber-600 dark:text-amber-400" />
                          Borrow
                        </Button>
                      </>
                    )}

                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(c)}
                          className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Edit details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={deletingId === c.id}
                          onClick={() => handleDeleteContact(c)}
                          className="p-1.5 rounded-full text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Delete person"
                        >
                          {deletingId === c.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">
            {contacts.length} {contacts.length === 1 ? 'person' : 'persons'} saved
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 px-4 text-xs rounded-full border-border bg-card text-foreground hover:bg-muted"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
