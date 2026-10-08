'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Loader2, List } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Category {
  id: string;
  name: string;
  description: string | null;
  code: string;
}

export default function CategoryManager() {
  const [expenseName, setExpenseName] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [issueName, setIssueName] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  
  const [isExpenseLoading, setIsExpenseLoading] = useState(false);
  const [isIssueLoading, setIsIssueLoading] = useState(false);

  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [issueCategories, setIssueCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchCategories = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    try {
      const [expenseRes, issueRes] = await Promise.all([
        fetch('/api/expense-categories'),
        fetch('/api/issue-categories')
      ]);

      if (expenseRes.ok) {
        const expenseData = await expenseRes.json();
        setExpenseCategories(expenseData);
      }
      if (issueRes.ok) {
        const issueData = await issueRes.json();
        setIssueCategories(issueData);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories();
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

  const handleAddIssueCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsIssueLoading(true);
      const res = await fetch('/api/issue-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: issueName, description: issueDesc })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add issue category');
      }
      toast.success('Issue category added successfully');
      setIssueName('');
      setIssueDesc('');
      fetchCategories(true); // Refresh list
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An error occurred');
      }
    } finally {
      setIsIssueLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* Expense Categories */}
      <div className="bg-card p-4 sm:p-6 rounded-xl border border-border shadow-xs text-card-foreground flex flex-col gap-6">
        <div>
          <h2 className="text-base sm:text-lg font-semibold mb-4 border-b border-border pb-2 text-card-foreground">Add Expense Category</h2>
          <form onSubmit={handleAddExpenseCategory} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Category Name</label>
              <input
                type="text"
                required
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                placeholder="e.g. Travel"
                className="w-full bg-muted/50 border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Description (Optional)</label>
              <input
                type="text"
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                placeholder="e.g. Travel and commuting expenses"
                className="w-full bg-muted/50 border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isExpenseLoading}
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 h-10 rounded-lg text-xs sm:text-sm font-semibold hover:opacity-90 transition-colors w-full disabled:opacity-50 shadow-xs"
            >
              {isExpenseLoading ? <Loader2 size={16} className="animate-spin" /> : 'Add Expense Category'}
            </button>
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
                <li key={cat.id} className="bg-muted/40 border border-border rounded-lg p-3">
                  <p className="font-medium text-xs sm:text-sm text-foreground">{cat.name}</p>
                  {cat.description && <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Issue Categories */}
      <div className="bg-card p-4 sm:p-6 rounded-xl border border-border shadow-xs text-card-foreground flex flex-col gap-6">
        <div>
          <h2 className="text-base sm:text-lg font-semibold mb-4 border-b border-border pb-2 text-card-foreground">Add Issue Category</h2>
          <form onSubmit={handleAddIssueCategory} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Category Name</label>
              <input
                type="text"
                required
                value={issueName}
                onChange={(e) => setIssueName(e.target.value)}
                placeholder="e.g. Missing Item"
                className="w-full bg-muted/50 border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Description (Optional)</label>
              <input
                type="text"
                value={issueDesc}
                onChange={(e) => setIssueDesc(e.target.value)}
                placeholder="e.g. Order arrived without some items"
                className="w-full bg-muted/50 border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isIssueLoading}
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 h-10 rounded-lg text-xs sm:text-sm font-semibold hover:opacity-90 transition-colors w-full disabled:opacity-50 shadow-xs"
            >
              {isIssueLoading ? <Loader2 size={16} className="animate-spin" /> : 'Add Issue Category'}
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2 text-foreground"><List size={16} /> Current Issue Categories</h3>
          {isLoadingCategories ? (
            <LoadingSpinner size="small" />
          ) : issueCategories.length === 0 ? (
            <p className="text-muted-foreground text-xs italic">No issue categories added yet.</p>
          ) : (
            <ul className={`space-y-2 max-h-64 overflow-y-auto pr-1 transition-opacity duration-200 ${isRefreshing ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              {issueCategories.map(cat => (
                <li key={cat.id} className="bg-muted/40 border border-border rounded-lg p-3">
                  <p className="font-medium text-xs sm:text-sm text-foreground">{cat.name}</p>
                  {cat.description && <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
