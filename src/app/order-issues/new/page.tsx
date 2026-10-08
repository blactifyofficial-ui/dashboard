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
    <div className="flex flex-col min-h-full pb-12 sm:pb-20 space-y-4 sm:space-y-6 max-w-4xl mx-auto w-full">
      <header className="flex-none flex flex-col gap-3 sm:gap-4">
        <Link href="/order-issues" className="inline-flex items-center text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors w-fit p-1 min-h-[36px]">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Issues
        </Link>
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Create Order Issue</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">File a new issue for a customer order</p>
        </div>
      </header>

      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <div className="relative">
              <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5 sm:mb-2">Order Search (ID or Name)</label>
              <input 
                type="text" 
                placeholder="Search orders..."
                className={`w-full bg-background border ${errors.orderId ? 'border-rose-500' : 'border-border'} rounded-lg px-3.5 py-2.5 min-h-[40px] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors`}
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
              {errors.orderId && <p className="text-rose-500 text-xs mt-1.5">{errors.orderId}</p>}
              {showOrderDropdown && orderSuggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-popover text-popover-foreground border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {orderSuggestions.map((order, index) => (
                    <div 
                      key={order.id}
                      className={`p-3 cursor-pointer border-b border-border last:border-0 ${index === focusedIndex ? 'bg-muted' : 'hover:bg-muted/60'}`}
                      onClick={() => {
                        setSelectedOrder(order);
                        setFormData({ ...formData, orderId: order.id });
                        setOrderSearchQuery(order.orderNumber || order.id);
                        setShowOrderDropdown(false);
                      }}
                    >
                      <div className="font-medium text-foreground text-sm">{order.orderNumber || order.id}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {order.customerName || 'Unknown Customer'} {order.customerEmail ? `• ${order.customerEmail}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedOrder && (
                <div className="mt-3 text-xs text-foreground bg-muted/40 border border-border rounded-lg p-3">
                  <span className="text-muted-foreground block text-[11px] mb-1 uppercase tracking-wider font-semibold">Customer Info</span>
                  <div className="font-medium text-foreground text-sm">{selectedOrder.customerName || 'Unknown Name'}</div>
                  <div className="text-muted-foreground mt-1 flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    {selectedOrder.customerEmail || 'No email provided'}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5 sm:mb-2">Issue Category</label>
              <select 
                className={`w-full bg-background border ${errors.categoryId ? 'border-rose-500' : 'border-border'} rounded-lg px-3.5 py-2.5 min-h-[40px] text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors appearance-none pr-10`}
                style={{
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1em 1em'
                }}
                value={formData.categoryId}
                onChange={e => {
                  setFormData({...formData, categoryId: e.target.value});
                  if (errors.categoryId) setErrors({ ...errors, categoryId: '' });
                }}
              >
                <option value="" className="bg-popover text-popover-foreground">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-popover text-popover-foreground">{cat.name}</option>
                ))}
              </select>
              {categories.find(c => c.id === formData.categoryId)?.name.toLowerCase() === 'other' && (
                <div className="mt-3">
                  <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5 sm:mb-2">Please specify</label>
                  <input 
                    type="text" 
                    placeholder="Specify the category..."
                    className={`w-full bg-background border ${errors.otherCategoryText ? 'border-rose-500' : 'border-border'} rounded-lg px-3.5 py-2.5 min-h-[40px] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors`}
                    value={otherCategoryText}
                    onChange={e => {
                      setOtherCategoryText(e.target.value);
                      if (errors.otherCategoryText) setErrors({ ...errors, otherCategoryText: '' });
                    }}
                  />
                  {errors.otherCategoryText && <p className="text-rose-500 text-xs mt-1.5">{errors.otherCategoryText}</p>}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5 sm:mb-2">Title</label>
            <input 
              type="text" 
              placeholder="Short issue title"
              className={`w-full bg-background border ${errors.title ? 'border-rose-500' : 'border-border'} rounded-lg px-3.5 py-2.5 min-h-[40px] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors`}
              value={formData.title}
              onChange={e => {
                setFormData({...formData, title: e.target.value});
                if (errors.title) setErrors({ ...errors, title: '' });
              }}
            />
            {errors.title && <p className="text-rose-500 text-xs mt-1.5">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5 sm:mb-2">Priority</label>
            <select 
              className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 min-h-[40px] text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors appearance-none pr-10"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1em 1em'
              }}
              value={formData.priority}
              onChange={e => setFormData({...formData, priority: e.target.value})}
            >
              <option value="LOW" className="bg-popover text-popover-foreground">Low</option>
              <option value="MEDIUM" className="bg-popover text-popover-foreground">Medium</option>
              <option value="HIGH" className="bg-popover text-popover-foreground">High</option>
              <option value="URGENT" className="bg-popover text-popover-foreground">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5 sm:mb-2">Description</label>
            <textarea 
              rows={4}
              placeholder="Describe the issue..."
              className={`w-full bg-background border ${errors.description ? 'border-rose-500' : 'border-border'} rounded-lg p-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors resize-y`}
              value={formData.description}
              onChange={e => {
                setFormData({...formData, description: e.target.value});
                if (errors.description) setErrors({ ...errors, description: '' });
              }}
            ></textarea>
            {errors.description && <p className="text-rose-500 text-xs mt-1.5">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5 sm:mb-2">Initial Remark (Optional)</label>
            <textarea 
              rows={3}
              placeholder="Add an initial remark..."
              className="w-full bg-background border border-border rounded-lg p-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors resize-y"
              value={formData.initialRemark}
              onChange={e => setFormData({...formData, initialRemark: e.target.value})}
            ></textarea>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-border">
            <button 
              type="button" 
              onClick={() => router.push('/order-issues')}
              className="py-2.5 px-4 min-h-[38px] bg-muted hover:bg-muted/80 rounded-lg font-medium text-foreground transition-colors text-center text-sm border border-border"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="py-2.5 px-5 min-h-[38px] bg-primary text-primary-foreground hover:opacity-90 rounded-lg font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 text-sm shadow-xs"
            >
              {loading ? 'Creating...' : 'Create Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
