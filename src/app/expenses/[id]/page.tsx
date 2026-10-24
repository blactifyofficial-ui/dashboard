'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2, Save, X, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ConfirmModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type Activity = {
  id: string;
  activityType: string;
  oldValue?: string;
  newValue?: string;
  remark?: string;
  createdAt: string;
  actorName?: string;
};

type Expense = {
  id: string;
  title: string;
  description: string | null;
  amount: string;
  expenseDate: string;
  referenceNumber: string | null;
  categoryId: string;
  paymentMethodId: string;
  category: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  activities: Activity[];
};

type Category = { id: string; name: string };
type PaymentMethod = { id: string; name: string };

export default function ExpenseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canEditExpenses = hasPermission('expenses:edit');
  const canDeleteExpenses = hasPermission('expenses:delete');

  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const submitLockRef = useRef(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const [formData, setFormData] = useState({
    categoryId: '',
    paymentMethodId: '',
    title: '',
    description: '',
    amount: '',
    expenseDate: '',
    referenceNumber: '',
  });

  const fetchExpense = useCallback(async () => {
    try {
      const res = await fetch(`/api/expenses/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error('Expense not found');
          router.push('/expenses');
          return;
        }
        throw new Error('Failed to fetch expense');
      }
      const data = await res.json();
      setExpense(data);
      setFormData({
        categoryId: data.categoryId,
        paymentMethodId: data.paymentMethodId,
        title: data.title,
        description: data.description || '',
        amount: data.amount,
        expenseDate: new Date(data.expenseDate).toISOString().split('T')[0],
        referenceNumber: data.referenceNumber || '',
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to load expense');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    const load = async () => {
      await fetchExpense();
    };
    void load();
  }, [fetchExpense]);

  useEffect(() => {
    if (!isEditing) return;
    const fetchOptions = async () => {
      try {
        const [catRes, pmRes] = await Promise.all([
          fetch('/api/expense-categories'),
          fetch('/api/payment-methods'),
        ]);
        if (catRes.ok) setCategories(await catRes.json());
        if (pmRes.ok) setPaymentMethods(await pmRes.json());
      } catch {
        toast.error('Failed to load form options');
      }
    };
    fetchOptions();
  }, [isEditing]);

  const handleSave = async () => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update expense');
      }

      toast.success('Expense updated successfully');
      setIsEditing(false);
      fetchExpense();
    } catch (error: unknown) {
      if (error instanceof Error) toast.error(error.message);
      else toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Expense deleted');
        router.push('/expenses');
      } else {
        toast.error('Failed to delete expense');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelEdit = () => {
    if (!expense) return;
    setFormData({
      categoryId: expense.categoryId,
      paymentMethodId: expense.paymentMethodId,
      title: expense.title,
      description: expense.description || '',
      amount: expense.amount,
      expenseDate: new Date(expense.expenseDate).toISOString().split('T')[0],
      referenceNumber: expense.referenceNumber || '',
    });
    setIsEditing(false);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!expense) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        Expense not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6">
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button variant="outline" size="icon" asChild className="h-9 w-9 shrink-0">
            <Link href="/expenses" title="Back to Expenses">
              <ArrowLeft size={16} />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{isEditing ? 'Edit Expense' : expense.title}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {isEditing ? 'Modify expense details below' : `Created ${new Date(expense.createdAt).toLocaleDateString()}`}
            </p>
          </div>
        </div>

        {!isEditing && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {canEditExpenses && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Pencil size={14} /> Edit
              </Button>
            )}
            {canDeleteExpenses && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 size={14} /> Delete
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {isEditing ? (
            /* ── Edit Form ── */
            <Card>
              <CardHeader className="pb-4 border-b border-border">
                <CardTitle className="text-base font-semibold">Edit Expense Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Title</label>
                    <Input
                      required
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Amount (₹)</label>
                    <Input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Category</label>
                    <select
                      required
                      value={formData.categoryId}
                      onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                    >
                      <option value="" className="bg-popover text-popover-foreground">Select Category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id} className="bg-popover text-popover-foreground">{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Payment Method</label>
                    <select
                      required
                      value={formData.paymentMethodId}
                      onChange={e => setFormData({ ...formData, paymentMethodId: e.target.value })}
                      className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                    >
                      <option value="" className="bg-popover text-popover-foreground">Select Payment</option>
                      {paymentMethods.map(p => (
                        <option key={p.id} value={p.id} className="bg-popover text-popover-foreground">{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Expense Date</label>
                  <Input
                    required
                    type="date"
                    value={formData.expenseDate}
                    onChange={e => setFormData({ ...formData, expenseDate: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Description (Optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-background border border-border rounded-md p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring h-24 resize-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Reference Number (Optional)</label>
                  <Input
                    type="text"
                    value={formData.referenceNumber}
                    onChange={e => setFormData({ ...formData, referenceNumber: e.target.value })}
                    className="font-mono"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:justify-end pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelEdit}
                    className="w-full sm:w-auto"
                  >
                    <X size={15} /> Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSave}
                    loading={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    <Save size={14} /> Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* ── Read-only Detail ── */
            <Card>
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  <Badge variant="outline">{expense.category}</Badge>
                  <Badge variant="secondary">{expense.paymentMethod}</Badge>
                  {expense.category?.toLowerCase().includes('meta') && (
                    <Button variant="outline" size="xs" asChild>
                      <Link href="/meta-ads" className="flex items-center gap-1.5">
                        <span>Meta Ads Tracker</span>
                        <ExternalLink size={12} />
                      </Link>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-medium">Amount</p>
                    <p className="text-2xl sm:text-3xl font-bold font-mono text-foreground">₹{parseFloat(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-medium">Expense Date</p>
                    <p className="text-base sm:text-lg font-medium text-foreground">{new Date(expense.expenseDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>

                {expense.description && (
                  <div className="mt-6 pt-5 border-t border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">Description</p>
                    <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{expense.description}</p>
                  </div>
                )}

                {expense.referenceNumber && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-medium">Reference Number</p>
                    <p className="font-mono text-sm text-foreground">{expense.referenceNumber}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Activity Timeline */}
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-semibold">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
            {expense.activities.length === 0 ? (
              <p className="text-muted-foreground text-xs">No activity recorded.</p>
            ) : (
              <div className="space-y-4">
                {expense.activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${
                        activity.activityType === 'CREATED' ? 'bg-emerald-500' :
                        activity.activityType === 'DELETED' ? 'bg-rose-500' :
                        activity.activityType === 'UPDATED' ? 'bg-amber-500' :
                        'bg-muted-foreground'
                      }`} />
                      <div className="w-px h-full bg-border mt-2" />
                    </div>
                    <div className="flex-1 pb-3">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {new Date(activity.createdAt).toLocaleString()} • {activity.actorName || 'System'}
                      </p>
                      {activity.activityType === 'CREATED' && (
                        <p className="text-sm text-foreground">Expense created — ₹{parseFloat(activity.newValue || '0').toFixed(2)}</p>
                      )}
                      {activity.activityType === 'UPDATED' && (
                        <p className="text-sm text-foreground">
                          Expense updated
                          {activity.oldValue && activity.newValue && activity.oldValue !== activity.newValue && (
                            <span className="text-muted-foreground"> — amount changed from ₹{parseFloat(activity.oldValue).toFixed(2)} to ₹{parseFloat(activity.newValue).toFixed(2)}</span>
                          )}
                        </p>
                      )}
                      {activity.activityType === 'DELETED' && (
                        <p className="text-sm text-rose-500">Expense deleted</p>
                      )}
                      {activity.activityType === 'REMARK_ADDED' && activity.remark && (
                        <div className="mt-1 bg-muted p-2.5 rounded-lg border border-border text-foreground text-xs">
                          &quot;{activity.remark}&quot;
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Category</span>
                  <span className="font-medium text-xs text-foreground">{expense.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Payment</span>
                  <span className="font-medium text-xs text-foreground">{expense.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Date</span>
                  <span className="text-xs text-foreground">{new Date(expense.expenseDate).toLocaleDateString()}</span>
                </div>
                {expense.referenceNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">Reference</span>
                    <span className="font-mono text-xs text-foreground">{expense.referenceNumber}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-border flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">Amount</span>
                  <span className="font-bold text-base font-mono text-foreground">₹{parseFloat(expense.amount).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Created</p>
                  <p className="text-xs text-foreground">{new Date(expense.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Last Updated</p>
                  <p className="text-xs text-foreground">{new Date(expense.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
