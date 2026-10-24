'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
        <Button variant="outline" size="icon" asChild className="h-9 w-9 shrink-0">
          <Link href="/expenses" title="Back to Expenses">
            <ArrowLeft size={16} />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Add Expense</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Create a new business expense record</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b border-border">
          <CardTitle className="text-base font-semibold">Expense Details</CardTitle>
          <CardDescription>Fill in the transaction details and payment allocation.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Category *</label>
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
                
                {isOtherCategory && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Custom Category Name *</label>
                    <Input
                      required
                      type="text"
                      placeholder="E.g., Software Subscriptions"
                      value={formData.customCategoryName}
                      onChange={e => setFormData({ ...formData, customCategoryName: e.target.value })}
                    />
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Expense Date *</label>
                  <Input
                    required
                    type="date"
                    value={formData.expenseDate}
                    onChange={e => setFormData({ ...formData, expenseDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Title *</label>
                <Input
                  required
                  type="text"
                  placeholder="E.g., Petrol for delivery"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Amount (₹) *</label>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Payment Method *</label>
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
                <label className="text-xs font-medium text-foreground">Description (Optional)</label>
                <textarea
                  placeholder="Enter additional details..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-background border border-border rounded-md p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring h-24 resize-none transition-colors"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Initial Remark (Optional)</label>
                <Input
                  type="text"
                  placeholder="E.g., Added via web portal"
                  value={formData.initialRemark}
                  onChange={e => setFormData({ ...formData, initialRemark: e.target.value })}
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Reference Number (Optional)</label>
                <Input
                  type="text"
                  placeholder="E.g., UPI123456789"
                  value={formData.referenceNumber}
                  onChange={e => setFormData({ ...formData, referenceNumber: e.target.value })}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:justify-end pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                asChild
                className="w-full sm:w-auto"
              >
                <Link href="/expenses">Cancel</Link>
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                className="w-full sm:w-auto"
              >
                Save Expense
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
