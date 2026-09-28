'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Pencil, Trash2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ConfirmModal';
import LoadingSpinner from '@/components/LoadingSpinner';

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchExpense();
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
      <div className="flex h-[50vh] items-center justify-center text-white/60">
        Expense not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
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
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/expenses"
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{isEditing ? 'Edit Expense' : expense.title}</h1>
            <p className="text-sm text-white/60">
              {isEditing ? 'Modify expense details below' : `Created ${new Date(expense.createdAt).toLocaleDateString()}`}
            </p>
          </div>
        </div>

        {!isEditing && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Pencil size={16} /> Edit
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {isEditing ? (
            /* ── Edit Form ── */
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/60">Title</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/60">Amount (₹)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/60">Category</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/60">Payment Method</label>
                  <select
                    required
                    value={formData.paymentMethodId}
                    onChange={e => setFormData({ ...formData, paymentMethodId: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                  >
                    <option value="">Select Payment</option>
                    {paymentMethods.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Expense Date</label>
                <input
                  required
                  type="date"
                  value={formData.expenseDate}
                  onChange={e => setFormData({ ...formData, expenseDate: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30 h-20 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Reference Number (Optional)</label>
                <input
                  type="text"
                  value={formData.referenceNumber}
                  onChange={e => setFormData({ ...formData, referenceNumber: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
                >
                  <X size={16} /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Saving...</>
                  ) : (
                    <><Save size={16} /> Save Changes</>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* ── Read-only Detail ── */
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium">{expense.category}</span>
                <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium">{expense.paymentMethod}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Amount</p>
                  <p className="text-3xl font-bold">₹{parseFloat(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Expense Date</p>
                  <p className="text-lg font-medium">{new Date(expense.expenseDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>

              {expense.description && (
                <div className="mt-6 pt-5 border-t border-white/5">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Description</p>
                  <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{expense.description}</p>
                </div>
              )}

              {expense.referenceNumber && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Reference Number</p>
                  <p className="font-mono text-sm text-white/70">{expense.referenceNumber}</p>
                </div>
              )}
            </div>
          )}

          {/* Activity Timeline */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-5">Activity Timeline</h2>
            {expense.activities.length === 0 ? (
              <p className="text-white/40 text-sm">No activity recorded.</p>
            ) : (
              <div className="space-y-5">
                {expense.activities.map((activity) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mt-2 ${
                        activity.activityType === 'CREATED' ? 'bg-green-500' :
                        activity.activityType === 'DELETED' ? 'bg-red-500' :
                        activity.activityType === 'UPDATED' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`} />
                      <div className="w-0.5 h-full bg-white/10 mt-2" />
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm text-white/40 mb-1">
                        {new Date(activity.createdAt).toLocaleString()} • {activity.actorName || 'System'}
                      </p>
                      {activity.activityType === 'CREATED' && (
                        <p className="text-white/80">Expense created — ₹{parseFloat(activity.newValue || '0').toFixed(2)}</p>
                      )}
                      {activity.activityType === 'UPDATED' && (
                        <p className="text-white/80">
                          Expense updated
                          {activity.oldValue && activity.newValue && activity.oldValue !== activity.newValue && (
                            <span className="text-white/50"> — amount changed from ₹{parseFloat(activity.oldValue).toFixed(2)} to ₹{parseFloat(activity.newValue).toFixed(2)}</span>
                          )}
                        </p>
                      )}
                      {activity.activityType === 'DELETED' && (
                        <p className="text-red-400">Expense deleted</p>
                      )}
                      {activity.activityType === 'REMARK_ADDED' && activity.remark && (
                        <div className="mt-1 bg-white/5 p-3 rounded-lg border border-white/5 text-white/70 text-sm">
                          &quot;{activity.remark}&quot;
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">Details</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-white/40">Category</span>
                <span className="font-medium">{expense.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Payment</span>
                <span className="font-medium">{expense.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Date</span>
                <span>{new Date(expense.expenseDate).toLocaleDateString()}</span>
              </div>
              {expense.referenceNumber && (
                <div className="flex justify-between">
                  <span className="text-white/40">Reference</span>
                  <span className="font-mono text-xs">{expense.referenceNumber}</span>
                </div>
              )}
              <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                <span className="text-white/40">Amount</span>
                <span className="font-bold text-lg">₹{parseFloat(expense.amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">Timestamps</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-white/40 mb-0.5">Created</p>
                <p>{new Date(expense.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-white/40 mb-0.5">Last Updated</p>
                <p>{new Date(expense.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
