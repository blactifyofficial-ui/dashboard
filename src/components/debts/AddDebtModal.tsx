'use client';

import { useState } from 'react';
import { Debt, DebtContact, DebtFormData, DebtType, PaymentMethod } from './types';
import { formatInputDate, formatCurrency } from './utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  X,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CreditCard,
  FileText,
  Bookmark,
  Users,
  Plus,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AddDebtModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingDebt?: Debt | null;
  defaultType?: DebtType;
  paymentMethods: PaymentMethod[];
  contacts?: DebtContact[];
  initialContact?: DebtContact | null;
  onRefreshContacts?: () => void;
  onOpenManageContacts?: () => void;
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

export default function AddDebtModal(props: AddDebtModalProps) {
  if (!props.open) return null;
  return (
    <AddDebtModalContent
      key={props.editingDebt?.id ?? `new_${props.defaultType}_${props.initialContact?.id ?? 'none'}`}
      {...props}
    />
  );
}

function AddDebtModalContent({
  onClose,
  onSuccess,
  editingDebt,
  defaultType = 'LENT',
  paymentMethods,
  contacts = [],
  initialContact = null,
  onRefreshContacts,
}: AddDebtModalProps) {
  const isEditing = !!editingDebt;

  // Selected contact ID from saved directory
  const [selectedContactId, setSelectedContactId] = useState<string>(() => {
    if (editingDebt?.contactId) return editingDebt.contactId;
    if (initialContact?.id) return initialContact.id;
    if (editingDebt?.contactName) {
      const match = contacts.find(
        (c) => c.name.toLowerCase() === editingDebt.contactName.trim().toLowerCase()
      );
      if (match) return match.id;
    }
    return '';
  });

  // Whether user is typing a custom name rather than choosing from list
  const [isCustomMode, setIsCustomMode] = useState<boolean>(() => {
    if (isEditing) return false;
    if (initialContact) return false;
    return contacts.length === 0;
  });

  // Checkbox to auto-save new custom person to contacts
  const [saveToContacts, setSaveToContacts] = useState(true);

  // Quick inline add person drawer
  const [showInlineAddPerson, setShowInlineAddPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonCategory, setNewPersonCategory] = useState('GENERAL');
  const [inlineSaving, setInlineSaving] = useState(false);

  const [formData, setFormData] = useState<DebtFormData>(() => {
    if (editingDebt) {
      return {
        type: editingDebt.type,
        contactId: editingDebt.contactId || undefined,
        contactName: editingDebt.contactName || '',
        category: editingDebt.category || 'GENERAL',
        amount: editingDebt.amount || '',
        transactionDate: formatInputDate(editingDebt.transactionDate),
        dueDate: editingDebt.dueDate ? formatInputDate(editingDebt.dueDate) : '',
        paymentMethodId: editingDebt.paymentMethodId || '',
        notes: editingDebt.notes || '',
        recordAsExpense: false,
      };
    }

    if (initialContact) {
      return {
        type: defaultType,
        contactId: initialContact.id,
        contactName: initialContact.name,
        category: initialContact.category || 'GENERAL',
        amount: '',
        transactionDate: formatInputDate(new Date()),
        dueDate: '',
        paymentMethodId: paymentMethods[0]?.id || '',
        notes: '',
        recordAsExpense: false,
      };
    }

    return {
      type: defaultType,
      contactId: undefined,
      contactName: '',
      category: 'GENERAL',
      amount: '',
      transactionDate: formatInputDate(new Date()),
      dueDate: '',
      paymentMethodId: paymentMethods[0]?.id || '',
      notes: '',
      recordAsExpense: false,
    };
  });

  const [saving, setSaving] = useState(false);

  // When a contact is selected from dropdown
  const handleSelectContact = (contactId: string) => {
    setSelectedContactId(contactId);
    if (!contactId) {
      setFormData((prev) => ({
        ...prev,
        contactId: undefined,
        contactName: '',
      }));
      return;
    }

    const contact = contacts.find((c) => c.id === contactId);
    if (contact) {
      setFormData((prev) => ({
        ...prev,
        contactId: contact.id,
        contactName: contact.name,
        category: contact.category || prev.category || 'GENERAL',
      }));
    }
  };

  // Quick inline add person handler
  const handleCreateInlinePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim()) {
      toast.error('Person name is required');
      return;
    }

    setInlineSaving(true);
    try {
      const res = await fetch('/api/debts/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPersonName.trim(),
          category: newPersonCategory.toUpperCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add person');

      toast.success(`Added ${data.contact.name} to directory`);
      onRefreshContacts?.();

      // Automatically select this new person
      setSelectedContactId(data.contact.id);
      setIsCustomMode(false);
      setShowInlineAddPerson(false);
      setFormData((prev) => ({
        ...prev,
        contactId: data.contact.id,
        contactName: data.contact.name,
        category: data.contact.category || prev.category,
      }));

      // Reset inline form
      setNewPersonName('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error adding person';
      toast.error(msg);
    } finally {
      setInlineSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.contactName.trim()) {
      toast.error('Contact name is required');
      return;
    }

    const numAmount = Number(formData.amount);
    if (!formData.amount || isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && editingDebt) {
        const res = await fetch(`/api/debts/${editingDebt.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contactId: formData.contactId || null,
            contactName: formData.contactName,
            category: formData.category,
            dueDate: formData.dueDate || null,
            paymentMethodId: formData.paymentMethodId || null,
            notes: formData.notes,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update debt');
        toast.success('Debt details updated successfully');
      } else {
        const res = await fetch('/api/debts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            saveContact: isCustomMode ? saveToContacts : false,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to record debt');
        toast.success(
          formData.type === 'LENT'
            ? 'Lent amount recorded successfully'
            : 'Borrowed amount recorded successfully'
        );
      }

      onSuccess();
      onRefreshContacts?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const selectedContactObject = contacts.find((c) => c.id === selectedContactId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-popover border border-border rounded-[18px] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {isEditing
                ? 'Edit Debt / Loan Record'
                : formData.type === 'LENT'
                ? 'Record Lent Money (You Gave)'
                : 'Record Borrowed Money (You Took)'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formData.type === 'LENT'
                ? 'Money you lent out that is expected to be repaid back to you'
                : 'Money you borrowed from someone that you need to repay'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 flex-1">
          {/* Type Toggle (Disabled during edit) */}
          {!isEditing && (
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Transaction Type
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: 'LENT' }))}
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                    formData.type === 'LENT'
                      ? 'bg-card text-emerald-700 dark:text-emerald-300 shadow-sm border border-emerald-500/20'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  <span>I Lent (They Owe Me)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: 'BORROWED' }))}
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                    formData.type === 'BORROWED'
                      ? 'bg-card text-amber-700 dark:text-amber-300 shadow-sm border border-amber-500/20'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4 text-amber-500" />
                  <span>I Borrowed (I Owe Them)</span>
                </button>
              </div>
            </div>
          )}

          {/* Person / Party Selection Section */}
          <div className="space-y-2.5 p-3.5 rounded-2xl bg-muted/20 border border-border">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" />
                Person / Entity <span className="text-rose-500">*</span>
              </label>

              {/* Mode Switcher */}
              <div className="flex items-center gap-1">
                {contacts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomMode(!isCustomMode);
                      setShowInlineAddPerson(false);
                    }}
                    className="text-[11px] font-medium text-primary hover:underline px-1.5 py-0.5"
                  >
                    {isCustomMode ? '← Pick from Person List' : 'Type Custom Name'}
                  </button>
                )}

                {!showInlineAddPerson && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowInlineAddPerson(true);
                      setIsCustomMode(false);
                    }}
                    className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    New Person
                  </button>
                )}
              </div>
            </div>

            {/* Inline Person Creator Form */}
            {showInlineAddPerson && (
              <div className="p-3 rounded-xl bg-card border border-primary/30 space-y-2.5 mb-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                    <Plus className="w-3 h-3 text-primary" />
                    Add New Person to Directory
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowInlineAddPerson(false)}
                    className="p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    placeholder="Full Name *"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    className="h-8 text-xs bg-background border-border text-foreground"
                    autoFocus
                  />
                  <select
                    value={newPersonCategory}
                    onChange={(e) => setNewPersonCategory(e.target.value)}
                    className="h-8 px-2 text-xs bg-background border border-border rounded-[9px] text-foreground cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-1.5 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInlineAddPerson(false)}
                    className="h-7 px-2.5 text-[11px] rounded-full border-border bg-card text-foreground"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={inlineSaving || !newPersonName.trim()}
                    onClick={handleCreateInlinePerson}
                    className="h-7 px-3 text-[11px] font-semibold rounded-full bg-primary text-primary-foreground"
                  >
                    {inlineSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save & Select'}
                  </Button>
                </div>
              </div>
            )}

            {/* Choose from List Dropdown */}
            {!isCustomMode ? (
              <div className="space-y-2">
                <div className="relative">
                  <select
                    value={selectedContactId}
                    onChange={(e) => handleSelectContact(e.target.value)}
                    className="w-full h-10 pl-3.5 pr-9 appearance-none text-xs font-semibold bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-colors"
                  >
                    <option value="" className="bg-card text-muted-foreground">
                      {contacts.length === 0
                        ? '-- No persons saved yet (type custom or add one) --'
                        : `-- Choose a person from list (${contacts.length} saved) --`}
                    </option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id} className="bg-card text-foreground">
                        {c.name} ({c.category})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Selected Contact Card Preview */}
                {selectedContactObject && (
                  <div className="p-2.5 rounded-xl bg-card border border-border flex items-center justify-between text-xs text-foreground">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{selectedContactObject.name}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-muted font-medium text-muted-foreground">
                          {selectedContactObject.category}
                        </span>
                      </div>
                    </div>

                    {selectedContactObject.netBalance !== undefined && Math.abs(selectedContactObject.netBalance) > 0.01 && (
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground block">Current Balance</span>
                        <span
                          className={`text-xs font-mono font-bold ${
                            selectedContactObject.netBalance > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {selectedContactObject.netBalance > 0
                            ? `+${formatCurrency(selectedContactObject.netBalance)}`
                            : `-${formatCurrency(Math.abs(selectedContactObject.netBalance))}`}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Custom Name Input */
              <div className="space-y-2">
                <Input
                  value={formData.contactName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contactName: e.target.value }))}
                  placeholder="e.g. Rahul Sharma, Apex Agency, Bank"
                  className="h-10 text-xs bg-card border-border text-foreground rounded-xl"
                  required
                  autoFocus
                />

                {!isEditing && (
                  <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                    <input
                      type="checkbox"
                      checked={saveToContacts}
                      onChange={(e) => setSaveToContacts(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-[11px] text-muted-foreground">
                      Save this person to directory for future quick selection
                    </span>
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Amount & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 flex items-center gap-1.5">
                Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                min="1"
                disabled={isEditing}
                value={formData.amount}
                onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                placeholder="50000"
                className={`h-10 text-xs font-mono font-semibold bg-card border-border text-foreground rounded-xl ${
                  isEditing ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                required
              />
              {isEditing && (
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  Original principal cannot be edited directly.
                </span>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-muted-foreground" />
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full h-10 px-3 text-xs bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-card text-foreground">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Transaction Date & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Transaction Date <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                disabled={isEditing}
                value={formData.transactionDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, transactionDate: e.target.value }))}
                className={`h-10 text-xs bg-card border-border text-foreground rounded-xl ${
                  isEditing ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Target Due Date (Optional)
              </label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                className="h-10 text-xs bg-card border-border text-foreground rounded-xl"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
              Payment Method
            </label>
            <select
              value={formData.paymentMethodId}
              onChange={(e) => setFormData((prev) => ({ ...prev, paymentMethodId: e.target.value }))}
              className="w-full h-10 px-3 text-xs bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="" className="bg-card text-muted-foreground">Select payment method (optional)...</option>
              {paymentMethods.map((pm) => (
                <option key={pm.id} value={pm.id} className="bg-card text-foreground">
                  {pm.name}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              Notes &amp; Terms (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g. 50% repayment by end of month, verbal agreement, etc."
              rows={2}
              className="w-full p-2.5 text-xs bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Record as Daily Expense option (only for new LENT) */}
          {!isEditing && formData.type === 'LENT' && (
            <div className="p-3 rounded-xl bg-card border border-border/80 flex items-start gap-2.5">
              <input
                id="recordAsExpense"
                type="checkbox"
                checked={formData.recordAsExpense}
                onChange={(e) => setFormData((prev) => ({ ...prev, recordAsExpense: e.target.checked }))}
                className="mt-0.5 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="recordAsExpense" className="text-xs text-foreground cursor-pointer select-none">
                <span className="font-semibold block">Record as Operational Cash-Out in Expenses</span>
                <span className="text-muted-foreground text-[11px] block mt-0.5">
                  Synchronizes this transaction with Daily Expenses under category &quot;Debt &amp; Advances&quot;.
                </span>
              </label>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={saving}
              className="h-9 px-4 text-xs rounded-full border-border bg-card text-foreground hover:bg-muted"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className={`h-9 px-5 text-xs font-semibold rounded-full text-white shadow-sm transition-all ${
                formData.type === 'LENT'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-amber-600 hover:bg-amber-500'
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-white" />
                  Saving...
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : formData.type === 'LENT' ? (
                'Record Lent Amount'
              ) : (
                'Record Borrowed Amount'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
