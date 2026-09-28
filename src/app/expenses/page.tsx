'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Expense {
  id: string;
  expenseDate: string;
  category: string;
  title: string;
  amount: string;
  paymentMethod: string;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showFilter, setShowFilter] = useState(false);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const expRes = await fetch('/api/expenses');
      if (!expRes.ok) throw new Error('Failed to fetch expenses');
      
      const expData = await expRes.json();
      setExpenses(expData);
    } catch (error: unknown) {
      console.error(error);
      toast.error('Failed to load expense data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const categories = ['All', ...Array.from(new Set(expenses.map(e => e.category).filter(Boolean)))];

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (expense.category && expense.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (expense.paymentMethod && expense.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesCategory = selectedCategory === 'All' || expense.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const calculateTotal = () => {
    return filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0).toFixed(2);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex-none flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-sm text-white/60">Manage your business expenses</p>
        </div>
        <Link
          href="/expenses/add"
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-white/90 transition-colors"
        >
          <Plus size={18} />
          Add Expense
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="flex-none grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm text-white/60 mb-1">Total Expenses</p>
              <p className="text-2xl font-bold">₹{calculateTotal()}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm text-white/60 mb-1">Total Records</p>
              <p className="text-2xl font-bold">{filteredExpenses.length}</p>
            </div>
          </div>

        <div className="flex-1 min-h-0 flex flex-col bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="flex-none p-4 border-b border-white/10 flex flex-col sm:flex-row gap-4 justify-between bg-black/50">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
              <input 
                type="text" 
                placeholder="Search expenses..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setShowFilter(!showFilter)}
                className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition-colors ${showFilter || selectedCategory !== 'All' ? 'bg-white/10 border-white/20 text-white' : 'text-white/60 hover:text-white bg-white/5 border-white/10'}`}
              >
                <Filter size={16} />
                {selectedCategory !== 'All' ? selectedCategory : 'Filter'}
              </button>

              {showFilter && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-10 py-1">
                  {categories.map(category => (
                    <button
                      key={category as string}
                      onClick={() => {
                        setSelectedCategory(category as string);
                        setShowFilter(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors ${selectedCategory === category ? 'text-white bg-white/5' : 'text-white/70'}`}
                    >
                      {category as string}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-auto no-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="sticky top-0 bg-neutral-950/80 backdrop-blur-md text-white/60 z-20 shadow-sm">
                <tr>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Title</th>
                  <th className="px-6 py-3 font-medium text-right">Amount</th>
                  <th className="px-6 py-3 font-medium">Payment</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-white/40">
                      No expenses found. Click &apos;Add Expense&apos; to create one.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">{new Date(expense.expenseDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className="bg-white/10 px-2 py-1 rounded text-xs">
                          {expense.category || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{expense.title}</p>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">₹{parseFloat(expense.amount).toFixed(2)}</td>
                      <td className="px-6 py-4">{expense.paymentMethod || 'N/A'}</td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/expenses/${expense.id}`} className="text-white/40 hover:text-white transition-colors">
                          <ArrowRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
