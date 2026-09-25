'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

type IssueCategory = {
  id: string;
  name: string;
};

type OrderSuggestion = {
  id: string;
  orderNumber?: string;
  customerName?: string;
  customerEmail?: string;
};

export default function CreateIssuePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<IssueCategory[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    orderId: '',
    categoryId: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    initialRemark: ''
  });
  const [otherCategoryText, setOtherCategoryText] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});


  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderSuggestions, setOrderSuggestions] = useState<OrderSuggestion[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderSuggestion | null>(null);
  const [showOrderDropdown, setShowOrderDropdown] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  useEffect(() => {
    // setFocusedIndex(-1); // removed to avoid cascading render
    if (orderSearchQuery.length >= 2 && showOrderDropdown) {
      const delayFn = setTimeout(() => {
        fetch(`/api/orders/search?q=${encodeURIComponent(orderSearchQuery)}`)
          .then(res => res.json())
          .then(data => setOrderSuggestions(data))
          .catch(() => setOrderSuggestions([]));
      }, 300);
      return () => clearTimeout(delayFn);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOrderSuggestions([]);
    }
  }, [orderSearchQuery, showOrderDropdown]);

  useEffect(() => {
    fetch('/api/issue-categories')
      .then(res => res.json())
      .then(data => setCategories(data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.orderId) {
      newErrors.orderId = 'Please select a valid order.';
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Issue category is required.';
    }
    
    const isOtherSelected = categories.find(c => c.id === formData.categoryId)?.name.toLowerCase() === 'other';
    if (isOtherSelected && !otherCategoryText.trim()) {
      newErrors.otherCategoryText = 'Please specify the category.';
    }
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required.';
    } else if (!/^[a-zA-Z0-9\s.,?!'()[\]-]+$/.test(formData.title)) {
      newErrors.title = 'Title contains invalid characters (only letters, numbers, and basic punctuation allowed).';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters long.';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setLoading(true);
    
    const finalDescription = isOtherSelected && otherCategoryText.trim() 
      ? `[Specified Category: ${otherCategoryText}]\n\n${formData.description}`
      : formData.description;
      
    try {
      const res = await fetch('/api/order-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, description: finalDescription }),
      });
      if (res.ok) {
        toast.success('Issue created successfully');
        router.push('/order-issues');
      } else {
        const err = await res.json();
        toast.error('Error: ' + err.error);
      }
    } catch {
      toast.error('Failed to create issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto text-white">
      <div className="mb-8">
        <Link href="/order-issues" className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Issues
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Create Order Issue</h1>
      </div>

      <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Order Search (ID or Name)</label>
              <input 
                type="text" 
                placeholder="Search orders..."
                className={`w-full bg-[#2a2a2a] border ${errors.orderId ? 'border-red-500' : 'border-white/10'} rounded-lg p-3 text-white focus:outline-none focus:border-white/30 transition-colors`}
                value={orderSearchQuery}
                onFocus={() => setShowOrderDropdown(true)}
                onBlur={() => setTimeout(() => setShowOrderDropdown(false), 200)}
                onKeyDown={e => {
                  if (!showOrderDropdown || orderSuggestions.length === 0) return;
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setFocusedIndex(prev => Math.min(prev + 1, orderSuggestions.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setFocusedIndex(prev => Math.max(prev - 1, -1));
                  } else if (e.key === 'Enter') {
                    if (focusedIndex >= 0) {
                      e.preventDefault();
                      const order = orderSuggestions[focusedIndex];
                      setSelectedOrder(order);
                      setFormData({ ...formData, orderId: order.id });
                      setOrderSearchQuery(order.orderNumber || order.id);
                      setShowOrderDropdown(false);
                    }
                  } else if (e.key === 'Escape') {
                    setShowOrderDropdown(false);
                  }
                }}
                onChange={e => {
                  setOrderSearchQuery(e.target.value);
                  setShowOrderDropdown(true);
                  setFocusedIndex(-1);
                  if (selectedOrder) setSelectedOrder(null);
                  setFormData({ ...formData, orderId: e.target.value });
                  if (errors.orderId) setErrors({ ...errors, orderId: '' });
                }}
              />
              {errors.orderId && <p className="text-red-500 text-xs mt-1.5">{errors.orderId}</p>}
              {showOrderDropdown && orderSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-[#2a2a2a] border border-white/10 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {orderSuggestions.map((order, index) => (
                    <div 
                      key={order.id}
                      className={`p-3 cursor-pointer border-b border-white/5 last:border-0 ${index === focusedIndex ? 'bg-white/20' : 'hover:bg-white/10'}`}
                      onClick={() => {
                        setSelectedOrder(order);
                        setFormData({ ...formData, orderId: order.id });
                        setOrderSearchQuery(order.orderNumber || order.id);
                        setShowOrderDropdown(false);
                      }}
                    >
                      <div className="font-medium text-white">{order.orderNumber || order.id}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {order.customerName || 'Unknown Customer'} {order.customerEmail ? `• ${order.customerEmail}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedOrder && (
                <div className="mt-4 text-sm text-gray-300 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <span className="text-gray-400 block text-xs mb-1 uppercase tracking-wider font-semibold">Customer Info</span>
                  <div className="font-medium text-white text-base">{selectedOrder.customerName || 'Unknown Name'}</div>
                  <div className="text-gray-400 mt-0.5 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    {selectedOrder.customerEmail || 'No email provided'}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Issue Category</label>
              <select 
                className={`w-full bg-[#2a2a2a] border ${errors.categoryId ? 'border-red-500' : 'border-white/10'} rounded-lg p-3 text-white focus:outline-none focus:border-white/30 transition-colors`}
                value={formData.categoryId}
                onChange={e => {
                  setFormData({...formData, categoryId: e.target.value});
                  if (errors.categoryId) setErrors({ ...errors, categoryId: '' });
                }}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {categories.find(c => c.id === formData.categoryId)?.name.toLowerCase() === 'other' && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Please specify</label>
                  <input 
                    type="text" 
                    placeholder="Specify the category..."
                    className={`w-full bg-[#2a2a2a] border ${errors.otherCategoryText ? 'border-red-500' : 'border-white/10'} rounded-lg p-3 text-white focus:outline-none focus:border-white/30 transition-colors`}
                    value={otherCategoryText}
                    onChange={e => {
                      setOtherCategoryText(e.target.value);
                      if (errors.otherCategoryText) setErrors({ ...errors, otherCategoryText: '' });
                    }}
                  />
                  {errors.otherCategoryText && <p className="text-red-500 text-xs mt-1.5">{errors.otherCategoryText}</p>}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Title</label>
            <input 
              type="text" 
              placeholder="Short issue title"
              className={`w-full bg-[#2a2a2a] border ${errors.title ? 'border-red-500' : 'border-white/10'} rounded-lg p-3 text-white focus:outline-none focus:border-white/30 transition-colors`}
              value={formData.title}
              onChange={e => {
                setFormData({...formData, title: e.target.value});
                if (errors.title) setErrors({ ...errors, title: '' });
              }}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1.5">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Priority</label>
            <select 
              className="w-full bg-[#2a2a2a] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-white/30 transition-colors"
              value={formData.priority}
              onChange={e => setFormData({...formData, priority: e.target.value})}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <textarea 
              rows={4}
              placeholder="Describe the issue..."
              className={`w-full bg-[#2a2a2a] border ${errors.description ? 'border-red-500' : 'border-white/10'} rounded-lg p-3 text-white focus:outline-none focus:border-white/30 transition-colors resize-y`}
              value={formData.description}
              onChange={e => {
                setFormData({...formData, description: e.target.value});
                if (errors.description) setErrors({ ...errors, description: '' });
              }}
            ></textarea>
            {errors.description && <p className="text-red-500 text-xs mt-1.5">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Initial Remark (Optional)</label>
            <textarea 
              rows={3}
              placeholder="Add an initial remark..."
              className="w-full bg-[#2a2a2a] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-white/30 transition-colors resize-y"
              value={formData.initialRemark}
              onChange={e => setFormData({...formData, initialRemark: e.target.value})}
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 mt-6 border-t border-white/5">
            <button 
              type="button" 
              onClick={() => router.push('/order-issues')}
              className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-white text-black px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
