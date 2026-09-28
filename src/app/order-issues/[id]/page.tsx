'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { useCallback } from 'react';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ConfirmModal';
import { Trash2, X, Phone, MessageCircle, Mail } from 'lucide-react';

type Activity = {
  id: string;
  createdAt: string;
  actorId: string;
  activityType: string;
  oldStatus?: string;
  newStatus?: string;
  remark?: string;
};

type Issue = {
  id: string;
  orderId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  updatedAt: string;
  assignedToId?: string;
  orderNumber?: string;
  customerName?: string;
  customerEmail?: string;
  totalPrice?: string;
  currency?: string;
  activities: Activity[];
};

type ShopifyLineItem = {
  id: string | number;
  title?: string;
  variant_title?: string;
  name?: string;
  quantity: number;
  price: string | number;
};

type ShopifyOrder = {
  order_number?: number | string;
  name?: string;
  created_at: string;
  financial_status?: string;
  fulfillment_status?: string;
  customer?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  shipping_address?: {
    name?: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    zip?: string;
    country?: string;
    phone?: string;
  };
  line_items?: ShopifyLineItem[];
  current_total_price?: string | number;
  currency?: string;
};

export default function IssueDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [newRemark, setNewRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [shopifyOrder, setShopifyOrder] = useState<ShopifyOrder | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);

  const fetchShopifyOrder = async (orderId: string) => {
    if (shopifyOrder) return;
    setLoadingOrder(true);
    try {
      const res = await fetch(`/api/shopify/order/${orderId}`);
      if (res.ok) {
        setShopifyOrder(await res.json());
      } else {
        toast.error('Failed to load full order details');
      }
    } catch {
      toast.error('Error fetching order details');
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleOpenOrderModal = () => {
    setIsOrderModalOpen(true);
    if (issue?.orderId) {
      fetchShopifyOrder(issue.orderId);
    }
  };

  const fetchIssue = useCallback(async () => {
    try {
      const res = await fetch(`/api/order-issues/${id}`);
      if (res.ok) {
        setIssue(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchIssue();
  }, [fetchIssue]);

  const handleStatusChange = async (newStatus: string) => {
    if (!issue) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/order-issues/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, lastUpdatedAt: issue.updatedAt }),
      });
      if (res.ok) {
        fetchIssue();
        toast.success('Status updated successfully');
      } else {
        toast.error((await res.json()).error || 'Failed to update status');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddRemark = async () => {
    if (!newRemark.trim()) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/order-issues/${id}/remarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remark: newRemark }),
      });
      if (res.ok) {
        setNewRemark('');
        fetchIssue();
        toast.success('Remark added successfully');
      } else {
        toast.error((await res.json()).error || 'Failed to add remark');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/order-issues/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Issue deleted successfully');
        router.push('/order-issues');
      } else {
        toast.error('Failed to delete issue');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  if (loading) return <div className="p-8 text-white">Loading issue...</div>;
  if (!issue) return <div className="p-8 text-white">Issue not found.</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto text-white">
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Order Issue"
        message="Are you sure you want to delete this order issue? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />

      <div className="flex justify-between items-center mb-6">
        <button onClick={() => router.push('/order-issues')} className="text-gray-400 hover:text-white flex items-center gap-2">
          ← Back to Issues
        </button>
        <button
          onClick={() => setDeleteModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 border border-red-500/20 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 text-sm font-medium transition-all"
        >
          <Trash2 size={16} /> Delete Issue
        </button>
      </div>

      {isOrderModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#1e1e1e] border border-white/10 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-semibold text-white">Full Order Details</h2>
              <button onClick={() => setIsOrderModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {loadingOrder ? (
                <div className="text-center py-8 text-gray-400">Loading order details...</div>
              ) : shopifyOrder ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Order Info</h3>
                      <div className="bg-[#2a2a2a] p-4 rounded-lg border border-white/5 space-y-3">
                        <div><span className="text-gray-400 text-xs">Number:</span> <div className="text-sm">{shopifyOrder.order_number || shopifyOrder.name}</div></div>
                        <div><span className="text-gray-400 text-xs">Date:</span> <div className="text-sm">{new Date(shopifyOrder.created_at).toLocaleString()}</div></div>
                        <div><span className="text-gray-400 text-xs">Financial Status:</span> <div className="text-sm uppercase">{shopifyOrder.financial_status}</div></div>
                        <div><span className="text-gray-400 text-xs">Fulfillment Status:</span> <div className="text-sm uppercase">{shopifyOrder.fulfillment_status || 'UNFULFILLED'}</div></div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Customer & Shipping</h3>
                      <div className="bg-[#2a2a2a] p-4 rounded-lg border border-white/5 space-y-3">
                        <div>
                          <span className="text-gray-400 text-xs">Customer:</span>
                          <div className="text-sm">
                            {shopifyOrder.customer ? `${shopifyOrder.customer.first_name || ''} ${shopifyOrder.customer.last_name || ''}` : 'N/A'}
                            {shopifyOrder.customer?.email && (
                              <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                <span>{shopifyOrder.customer.email}</span>
                                <a href={`mailto:${shopifyOrder.customer.email}`} className="text-blue-400 hover:text-blue-300 transition-colors" title="Mail">
                                  <Mail size={14} />
                                </a>
                              </div>
                            )}
                            {shopifyOrder.customer?.phone && (
                              <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                <span>{shopifyOrder.customer.phone}</span>
                                <a href={`tel:${shopifyOrder.customer.phone}`} className="text-green-400 hover:text-green-300 transition-colors" title="Call">
                                  <Phone size={14} />
                                </a>
                                <a href={`https://wa.me/${shopifyOrder.customer.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-400 transition-colors" title="WhatsApp">
                                  <MessageCircle size={14} />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                        {shopifyOrder.shipping_address && (
                          <div>
                            <span className="text-gray-400 text-xs">Shipping Address:</span>
                            <div className="text-sm mt-1 text-gray-300">
                              {shopifyOrder.shipping_address.name}<br/>
                              {shopifyOrder.shipping_address.address1}<br/>
                              {shopifyOrder.shipping_address.address2 && <>{shopifyOrder.shipping_address.address2}<br/></>}
                              {shopifyOrder.shipping_address.city}, {shopifyOrder.shipping_address.province} {shopifyOrder.shipping_address.zip}<br/>
                              {shopifyOrder.shipping_address.country}
                              {shopifyOrder.shipping_address.phone && (
                                <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                                  <span>Phone: {shopifyOrder.shipping_address.phone}</span>
                                  <a href={`tel:${shopifyOrder.shipping_address.phone}`} className="text-green-400 hover:text-green-300 transition-colors" title="Call">
                                    <Phone size={14} />
                                  </a>
                                  <a href={`https://wa.me/${shopifyOrder.shipping_address.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-400 transition-colors" title="WhatsApp">
                                    <MessageCircle size={14} />
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Line Items</h3>
                    <div className="bg-[#2a2a2a] rounded-lg border border-white/5 overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-[#1e1e1e] text-gray-400 text-xs">
                          <tr>
                            <th className="px-4 py-3 font-medium">Product</th>
                            <th className="px-4 py-3 font-medium">SKU</th>
                            <th className="px-4 py-3 font-medium text-right">Qty</th>
                            <th className="px-4 py-3 font-medium text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {shopifyOrder.line_items?.map((item: ShopifyLineItem) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3">
                                <div>{item.title}</div>
                                {item.variant_title && <div className="text-xs text-gray-400">{item.variant_title}</div>}
                              </td>
                              <td className="px-4 py-3 text-gray-400">{item.sku || '-'}</td>
                              <td className="px-4 py-3 text-right">{item.quantity}</td>
                              <td className="px-4 py-3 text-right">
                                {(Number(item.price) * item.quantity).toLocaleString('en-US', { style: 'currency', currency: shopifyOrder.currency || 'USD' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4 border-t border-white/10">
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Total Price</div>
                      <div className="text-2xl font-bold">
                        {Number(shopifyOrder.current_total_price).toLocaleString('en-US', { style: 'currency', currency: shopifyOrder.currency || 'USD' })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">Order not found in Shopify.</div>
              )}
            </div>
            <div className="p-4 border-t border-white/10 flex justify-end shrink-0 bg-black/20">
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">{issue.category}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                issue.priority === 'URGENT' ? 'bg-red-500/20 text-red-400' :
                issue.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>{issue.priority}</span>
            </div>
            
            <h1 className="text-2xl font-semibold mb-2">{issue.title}</h1>
            <p className="text-gray-400 font-mono text-sm mb-6">Issue #{issue.id.slice(0, 8)}</p>

            <div className="bg-[#2a2a2a] p-4 rounded-xl border border-white/5">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Description</h3>
              <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">{issue.description}</p>
            </div>
          </div>

          <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Activity Timeline</h2>
            <div className="space-y-6">
              {issue.activities.map((activity) => (
                <div key={activity.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-2"></div>
                    <div className="w-0.5 h-full bg-white/10 mt-2"></div>
                  </div>
                  <div className="flex-1 pb-6">
                    <p className="text-sm text-gray-400 mb-1">
                      {new Date(activity.createdAt).toLocaleString()} • {activity.actorId === 'unassigned' ? 'System' : 'Staff'}
                    </p>
                    {activity.activityType === 'CREATED' && (
                      <p className="font-medium text-gray-200">Issue created and marked as {activity.newStatus}</p>
                    )}
                    {activity.activityType === 'STATUS_CHANGED' && (
                      <p className="font-medium text-gray-200">
                        Status changed: <span className="text-gray-400 line-through mr-1">{activity.oldStatus}</span> → <span className="text-white">{activity.newStatus}</span>
                      </p>
                    )}
                    {activity.activityType === 'REMARK_ADDED' && (
                      <div className="mt-2 bg-[#2a2a2a] p-3 rounded-lg border border-white/5 text-gray-200">
                        &quot;{activity.remark}&quot;
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-6 border-t border-white/10">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Add Remark</h3>
              <textarea 
                rows={3} 
                className="w-full bg-[#2a2a2a] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 mb-3"
                placeholder="Type your remark here..."
                value={newRemark}
                onChange={e => setNewRemark(e.target.value)}
              />
              <button 
                onClick={handleAddRemark}
                disabled={isSubmitting || !newRemark.trim()}
                className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Adding...' : 'Add Remark'}
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-1 space-y-6">
          <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Properties</h3>
            
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Status</label>
              <select 
                className="w-full bg-[#2a2a2a] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                value={issue.status}
                onChange={e => handleStatusChange(e.target.value)}
                disabled={isSubmitting || issue.status === 'CLOSED'}
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="WAITING">Waiting</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Assigned To</label>
              <div className="w-full bg-[#2a2a2a] border border-white/10 rounded-lg p-2.5 text-white cursor-not-allowed opacity-70">
                {issue.assignedToId ? 'Staff Assigned' : 'Unassigned'}
              </div>
            </div>
          </div>

          <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Order Details</h3>
              <button 
                onClick={handleOpenOrderModal}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                View full order →
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Order Number</label>
                <div className="text-sm text-gray-200">{issue.orderNumber || issue.orderId}</div>
              </div>
              
              {issue.customerName && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Customer</label>
                  <div className="text-sm text-gray-200">{issue.customerName}</div>
                  {issue.customerEmail && <div className="text-xs text-gray-400 mt-0.5">{issue.customerEmail}</div>}
                </div>
              )}
              
              {issue.totalPrice && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Total</label>
                  <div className="text-sm text-gray-200">
                    {Number(issue.totalPrice).toLocaleString('en-US', {
                      style: 'currency',
                      currency: issue.currency || 'USD'
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
