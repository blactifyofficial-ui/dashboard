'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Loader2, List } from 'lucide-react';

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

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoadingCategories(true);
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
    }
  }, []);

  useEffect(() => {
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
      fetchCategories(); // Refresh list
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
      fetchCategories(); // Refresh list
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
      <div className="bg-[#1e1e1e] p-6 rounded-xl border border-white/10 shadow-sm text-white flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-medium mb-4 border-b border-white/10 pb-2">Add Expense Category</h2>
          <form onSubmit={handleAddExpenseCategory} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Category Name</label>
              <input
                type="text"
                required
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                placeholder="e.g. Travel"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Description (Optional)</label>
              <input
                type="text"
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                placeholder="e.g. Travel and commuting expenses"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
              />
            </div>
            <button
              type="submit"
              disabled={isExpenseLoading}
              className="flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors w-full disabled:opacity-70"
            >
              {isExpenseLoading ? <Loader2 size={16} className="animate-spin" /> : 'Add Expense Category'}
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-3 flex items-center gap-2"><List size={18} /> Current Expense Categories</h3>
          {isLoadingCategories ? (
            <div className="flex justify-center p-4"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
          ) : expenseCategories.length === 0 ? (
            <p className="text-gray-400 text-sm italic">No expense categories added yet.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {expenseCategories.map(cat => (
                <li key={cat.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <p className="font-medium">{cat.name}</p>
                  {cat.description && <p className="text-xs text-gray-400 mt-1">{cat.description}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Issue Categories */}
      <div className="bg-[#1e1e1e] p-6 rounded-xl border border-white/10 shadow-sm text-white flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-medium mb-4 border-b border-white/10 pb-2">Add Issue Category</h2>
          <form onSubmit={handleAddIssueCategory} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Category Name</label>
              <input
                type="text"
                required
                value={issueName}
                onChange={(e) => setIssueName(e.target.value)}
                placeholder="e.g. Missing Item"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Description (Optional)</label>
              <input
                type="text"
                value={issueDesc}
                onChange={(e) => setIssueDesc(e.target.value)}
                placeholder="e.g. Order arrived without some items"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
              />
            </div>
            <button
              type="submit"
              disabled={isIssueLoading}
              className="flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors w-full disabled:opacity-70"
            >
              {isIssueLoading ? <Loader2 size={16} className="animate-spin" /> : 'Add Issue Category'}
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-3 flex items-center gap-2"><List size={18} /> Current Issue Categories</h3>
          {isLoadingCategories ? (
            <div className="flex justify-center p-4"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
          ) : issueCategories.length === 0 ? (
            <p className="text-gray-400 text-sm italic">No issue categories added yet.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {issueCategories.map(cat => (
                <li key={cat.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <p className="font-medium">{cat.name}</p>
                  {cat.description && <p className="text-xs text-gray-400 mt-1">{cat.description}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
