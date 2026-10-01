'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Category {
  id: string;
  name: string;
}

interface PaymentMethod {
  id: string;
  name: string;
}

export default function AddExpensePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);
  
  const [formData, setFormData] = useState({
    categoryId: '',
    paymentMethodId: '',
    title: '',
    description: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    initialRemark: '',
    customCategoryName: ''
  });

  const isOtherCategory = categories.find(c => c.id === formData.categoryId)?.name === 'Other';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catRes, pmRes] = await Promise.all([
          fetch('/api/expense-categories'),
          fetch('/api/payment-methods')
        ]);

        if (!catRes.ok || !pmRes.ok) throw new Error('Failed to fetch required data');
        
        const catData = await catRes.json();
        const pmData = await pmRes.json();

        setCategories(catData);
        setPaymentMethods(pmData);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setIsSubmitting(true);
    console.log('[AddExpense] handleSubmit fired');
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create expense');
      }

      toast.success('Expense created successfully');
      router.push('/expenses');
      router.refresh();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An error occurred');
      }
    } finally {
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-4 sm:p-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <Link 
          href="/expenses" 
          className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white shrink-0"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">Add Expense</h1>
          <p className="text-xs sm:text-sm text-white/60">Create a new business expense record</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Category</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 min-h-[44px] text-base md:text-sm focus:outline-none focus:border-white/30"
                >
                  <option value="" className="bg-[#121212] text-white">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id} className="bg-[#121212] text-white">{c.name}</option>
                  ))}
                </select>
              </div>
              
              {isOtherCategory && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/60">Custom Category Name</label>
                  <input
                    required
                    type="text"
                    placeholder="E.g., Software Subscriptions"
                    value={formData.customCategoryName}
                    onChange={e => setFormData({ ...formData, customCategoryName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 min-h-[44px] text-base md:text-sm focus:outline-none focus:border-white/30"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Expense Date</label>
                <input
                  required
                  type="date"
                  value={formData.expenseDate}
                  onChange={e => setFormData({ ...formData, expenseDate: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 min-h-[44px] text-base md:text-sm focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Title</label>
              <input
                required
                type="text"
                placeholder="E.g., Petrol for delivery"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 min-h-[44px] text-base md:text-sm focus:outline-none focus:border-white/30"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Amount (₹)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 min-h-[44px] text-base md:text-sm focus:outline-none focus:border-white/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Payment Method</label>
                <select
                  required
                  value={formData.paymentMethodId}
                  onChange={e => setFormData({ ...formData, paymentMethodId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 min-h-[44px] text-base md:text-sm focus:outline-none focus:border-white/30"
                >
                  <option value="" className="bg-[#121212] text-white">Select Payment</option>
                  {paymentMethods.map(p => (
                    <option key={p.id} value={p.id} className="bg-[#121212] text-white">{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Description (Optional)</label>
              <textarea
                placeholder="Enter additional details..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-base md:text-sm focus:outline-none focus:border-white/30 h-24 resize-none"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Initial Remark (Optional)</label>
              <input
                type="text"
                placeholder="E.g., Added via web portal"
                value={formData.initialRemark}
                onChange={e => setFormData({ ...formData, initialRemark: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 min-h-[44px] text-base md:text-sm focus:outline-none focus:border-white/30"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Reference Number (Optional)</label>
              <input
                type="text"
                placeholder="E.g., UPI123456789"
                value={formData.referenceNumber}
                onChange={e => setFormData({ ...formData, referenceNumber: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 min-h-[44px] text-base md:text-sm focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-4 border-t border-white/10">
            <Link
              href="/expenses"
              className="w-full sm:w-auto px-6 h-11 min-h-[44px] flex items-center justify-center text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto h-11 min-h-[44px] flex items-center justify-center bg-white text-black px-6 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
