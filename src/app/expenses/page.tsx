'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

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

  const calculateTotal = () => {
    return expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-white/60 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold">₹{calculateTotal()}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-white/60 mb-1">Total Records</p>
          <p className="text-2xl font-bold">{expenses.length}</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <input 
              type="text" 
              placeholder="Search expenses..." 
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 text-sm text-white/60 hover:text-white px-3 py-2 bg-white/5 rounded-lg border border-white/10">
            <Filter size={16} />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/5 text-white/60">
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
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-white/40">
                    No expenses found. Click &apos;Add Expense&apos; to create one.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
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
                      <button className="text-white/40 hover:text-white transition-colors">
                        <ArrowRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
