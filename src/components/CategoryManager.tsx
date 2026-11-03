'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { List } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Category {
  id: string;
  name: string;
  description: string | null;
  code: string;
}

export default function CategoryManager() {
  const [expenseName, setExpenseName] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [isExpenseLoading, setIsExpenseLoading] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchCategories = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    try {
      const expenseRes = await fetch('/api/expense-categories');
      if (expenseRes.ok) {
        const expenseData = await expenseRes.json();
        setExpenseCategories(expenseData);
      }
    } catch (error) {
      console.error('Failed to fetch categories', error);
      toast.error('Failed to fetch categories');
    } finally {
      setIsLoadingCategories(false);
      if (refresh) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await fetchCategories();
    };
    void load();
  }, [fetchCategories]);

  const handleAddExpenseCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsExpenseLoading(true);
      const res = await fetch('/api/expense-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: expenseName, description: expenseDesc })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add expense category');
      }
      toast.success('Expense category added successfully');
      setExpenseName('');
      setExpenseDesc('');
      fetchCategories(true); // Refresh list
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An error occurred');
      }
    } finally {
      setIsExpenseLoading(false);
    }
  };

  return (
      <div className="bg-card p-5 sm:p-6 rounded-[18px] border border-border shadow-none text-card-foreground flex flex-col gap-6 w-full">
        <div>
          <h2 className="text-base sm:text-lg font-semibold mb-4 border-b border-border pb-2 text-card-foreground tracking-[-0.01em]">Add Expense Category</h2>
          <form onSubmit={handleAddExpenseCategory} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Category Name</label>
              <Input
                type="text"
                required
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                placeholder="e.g. Travel"
                className="h-10 rounded-[11px]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Description (Optional)</label>
              <Input
                type="text"
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                placeholder="e.g. Travel and commuting expenses"
                className="h-10 rounded-[11px]"
              />
            </div>
            <Button
              type="submit"
              disabled={isExpenseLoading}
              loading={isExpenseLoading}
              className="w-full rounded-full"
            >
              Add Expense Category
            </Button>
          </form>
        </div>

      <div>
        <h3 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2 text-foreground"><List size={16} /> Current Expense Categories</h3>
        {isLoadingCategories ? (
          <LoadingSpinner size="small" />
        ) : expenseCategories.length === 0 ? (
          <p className="text-muted-foreground text-xs italic">No expense categories added yet.</p>
        ) : (
          <ul className={`space-y-2 max-h-64 overflow-y-auto pr-1 transition-opacity duration-200 ${isRefreshing ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {expenseCategories.map(cat => (
              <li key={cat.id} className="bg-muted/30 border border-border rounded-[11px] p-3">
                <p className="font-semibold text-xs sm:text-sm text-foreground">{cat.name}</p>
                {cat.description && <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
