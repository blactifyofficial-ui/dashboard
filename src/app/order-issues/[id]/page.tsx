'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { useCallback } from 'react';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ConfirmModal';
import { Trash2, X, Phone, MessageCircle, Mail, ExternalLink, Clock, User, Tag, Hash } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

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
  sku?: string | null;
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    OPEN: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    IN_PROGRESS: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
    WAITING: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
    RESOLVED: 'bg-green-500/15 text-green-400 border border-green-500/20',
    CLOSED: 'bg-gray-500/15 text-gray-400 border border-gray-500/20',
    CANCELLED: 'bg-red-500/15 text-red-400 border border-red-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide ${map[status] || map.OPEN}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    URGENT: 'bg-red-500',
    HIGH: 'bg-orange-500',
    MEDIUM: 'bg-yellow-500',
    LOW: 'bg-gray-500',
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${map[priority] || 'bg-gray-500'}`} />;
}

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

  if (loading) return <LoadingSpinner />;
  if (!issue) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-gray-400">Issue not found.</p>
    </div>
  );

  return (
    <div className="min-h-screen text-white">
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Order Issue"
        message="Are you sure you want to delete this order issue? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />

      {/* Order Modal */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-[#141414] border border-white/8 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
            <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-white/8 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-white">Order Details</h2>
                <p className="text-xs text-gray-500 mt-0.5">Full Shopify order information</p>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="w-10 h-10 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {loadingOrder ? (
                <LoadingSpinner size="small" />
              ) : shopifyOrder ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white/3 border border-white/6 rounded-xl p-4 space-y-3">
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Order Info</p>
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-start">
                          <span className="text-xs text-gray-500">Number</span>
                          <span className="text-sm font-medium">{shopifyOrder.order_number || shopifyOrder.name}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs text-gray-500">Date</span>
                          <span className="text-xs text-gray-300 text-right">{new Date(shopifyOrder.created_at).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Payment</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/20 uppercase">
                            {shopifyOrder.financial_status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Fulfillment</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20 uppercase">
                            {shopifyOrder.fulfillment_status || 'UNFULFILLED'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/3 border border-white/6 rounded-xl p-4 space-y-3">
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Customer & Shipping</p>
                      <div>
                        <span className="text-xs text-gray-500">Customer</span>
                        <div className="text-sm font-medium mt-1">
                          {shopifyOrder.customer ? `${shopifyOrder.customer.first_name || ''} ${shopifyOrder.customer.last_name || ''}` : 'N/A'}
                        </div>
                        {shopifyOrder.customer?.email && (
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                            <span className="truncate">{shopifyOrder.customer.email}</span>
                            <a href={`mailto:${shopifyOrder.customer.email}`} className="p-1 min-h-[32px] min-w-[32px] flex items-center justify-center text-blue-400 hover:text-blue-300 shrink-0" title="Mail">
                              <Mail size={14} />
                            </a>
                          </div>
                        )}
                        {shopifyOrder.customer?.phone && (
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                            <span>{shopifyOrder.customer.phone}</span>
                            <a href={`tel:${shopifyOrder.customer.phone}`} className="p-1 min-h-[32px] min-w-[32px] flex items-center justify-center text-green-400 hover:text-green-300" title="Call">
                              <Phone size={14} />
                            </a>
                            <a href={`https://wa.me/${shopifyOrder.customer.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-1 min-h-[32px] min-w-[32px] flex items-center justify-center text-green-500 hover:text-green-400" title="WhatsApp">
                              <MessageCircle size={14} />
                            </a>
                          </div>
                        )}
                      </div>
                      {shopifyOrder.shipping_address && (
                        <div>
                          <span className="text-xs text-gray-500">Shipping Address</span>
                          <div className="text-xs text-gray-300 mt-1 leading-5">
                            {shopifyOrder.shipping_address.name}<br/>
                            {shopifyOrder.shipping_address.address1}<br/>
                            {shopifyOrder.shipping_address.address2 && <>{shopifyOrder.shipping_address.address2}<br/></>}
                            {shopifyOrder.shipping_address.city}, {shopifyOrder.shipping_address.province} {shopifyOrder.shipping_address.zip}<br/>
                            {shopifyOrder.shipping_address.country}
                            {shopifyOrder.shipping_address.phone && (
                              <div className="mt-1.5 flex items-center gap-2 text-gray-400">
                                <span>Phone: {shopifyOrder.shipping_address.phone}</span>
                                <a href={`tel:${shopifyOrder.shipping_address.phone}`} className="p-1 min-h-[32px] min-w-[32px] flex items-center justify-center text-green-400 hover:text-green-300" title="Call">
                                  <Phone size={14} />
                                </a>
                                <a href={`https://wa.me/${shopifyOrder.shipping_address.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-1 min-h-[32px] min-w-[32px] flex items-center justify-center text-green-500 hover:text-green-400" title="WhatsApp">
                                  <MessageCircle size={14} />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-3">Line Items</p>
                    <div className="border border-white/6 rounded-xl overflow-x-auto">
                      <table className="w-full min-w-[360px] text-sm text-left">
                        <thead className="bg-white/3">
                          <tr>
                            <th className="px-4 py-2.5 text-xs font-medium text-gray-500">Product</th>
                            <th className="px-4 py-2.5 text-xs font-medium text-gray-500">SKU</th>
                            <th className="px-4 py-2.5 text-xs font-medium text-gray-500 text-right">Qty</th>
                            <th className="px-4 py-2.5 text-xs font-medium text-gray-500 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/4">
                          {shopifyOrder.line_items?.map((item: ShopifyLineItem) => (
                            <tr key={item.id} className="hover:bg-white/2 transition-colors">
                              <td className="px-4 py-3">
                                <div className="text-sm">{item.title}</div>
                                {item.variant_title && <div className="text-xs text-gray-500 mt-0.5">{item.variant_title}</div>}
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-500 font-mono">{item.sku || '—'}</td>
                              <td className="px-4 py-3 text-right text-sm">{item.quantity}</td>
                              <td className="px-4 py-3 text-right text-sm font-medium">
                                {(Number(item.price) * item.quantity).toLocaleString('en-US', { style: 'currency', currency: shopifyOrder.currency || 'USD' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-end items-center gap-4 pt-1">
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-0.5">Total Price</div>
                      <div className="text-2xl font-bold tracking-tight">
                        {Number(shopifyOrder.current_total_price).toLocaleString('en-US', { style: 'currency', currency: shopifyOrder.currency || 'USD' })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <p className="text-gray-400">Order not found in Shopify.</p>
                </div>
              )}
            </div>
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-white/8 flex justify-end shrink-0">
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="px-5 py-2.5 min-h-[44px] bg-white/8 hover:bg-white/12 text-white rounded-xl transition-colors text-sm font-medium border border-white/8"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-5 sm:py-8">
        {/* Hero header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/12 text-blue-400 border border-blue-500/20">
                <Tag size={11} />
                {issue.category}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white/5 text-gray-300 border border-white/8">
                <PriorityDot priority={issue.priority} />
                {issue.priority}
              </span>
              <StatusBadge status={issue.status} />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white mb-1.5">{issue.title}</h1>
            <p className="text-sm text-gray-500 font-mono flex items-center gap-2">
              <Hash size={13} />
              {issue.id.slice(0, 8)}
            </p>
          </div>
          
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] border border-red-500/20 bg-red-500/8 text-red-400 rounded-xl hover:bg-red-500/15 text-sm font-medium transition-all shrink-0 w-full sm:w-auto"
          >
            <Trash2 size={14} />
            <span>Delete Issue</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main content — 2/3 */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5">

            {/* Description */}
            <section className="bg-[#141414] border border-white/8 rounded-2xl overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/6">
                <h2 className="text-sm font-semibold text-gray-200">Description</h2>
              </div>
              <div className="px-4 sm:px-6 py-4 sm:py-5">
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed text-sm">{issue.description}</p>
              </div>
            </section>

            {/* Activity timeline */}
            <section className="bg-[#141414] border border-white/8 rounded-2xl overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/6">
                <h2 className="text-sm font-semibold text-gray-200">Activity</h2>
              </div>
              <div className="px-4 sm:px-6 py-4 sm:py-5">
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-[7px] top-2 bottom-0 w-px bg-white/6" />

                  <div className="space-y-0">
                    {issue.activities.map((activity, idx) => (
                      <div key={activity.id} className="flex gap-4 relative pb-6 last:pb-0">
                        {/* Dot */}
                        <div className="relative z-10 shrink-0 mt-1">
                          {activity.activityType === 'CREATED' && (
                            <div className="w-3.5 h-3.5 rounded-full bg-blue-500 ring-4 ring-[#141414]" />
                          )}
                          {activity.activityType === 'STATUS_CHANGED' && (
                            <div className="w-3.5 h-3.5 rounded-full bg-purple-500 ring-4 ring-[#141414]" />
                          )}
                          {activity.activityType === 'REMARK_ADDED' && (
                            <div className="w-3.5 h-3.5 rounded-full bg-gray-500 ring-4 ring-[#141414]" />
                          )}
                          {!['CREATED', 'STATUS_CHANGED', 'REMARK_ADDED'].includes(activity.activityType) && (
                            <div className="w-3.5 h-3.5 rounded-full bg-gray-600 ring-4 ring-[#141414]" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0" style={{ marginTop: idx === 0 ? 0 : undefined }}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500">
                              {new Date(activity.createdAt).toLocaleString()}
                            </span>
                            <span className="text-gray-700">·</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <User size={11} />
                              {activity.actorId === 'unassigned' ? 'System' : 'Staff'}
                            </span>
                          </div>

                          {activity.activityType === 'CREATED' && (
                            <p className="text-sm text-gray-200">
                              Issue created and marked as <span className="text-blue-400 font-medium">{activity.newStatus}</span>
                            </p>
                          )}
                          {activity.activityType === 'STATUS_CHANGED' && (
                            <p className="text-sm text-gray-200 flex items-center gap-2 flex-wrap">
                              Status changed
                              <span className="text-gray-500 line-through text-xs">{activity.oldStatus}</span>
                              <span className="text-gray-400">→</span>
                              <StatusBadge status={activity.newStatus || ''} />
                            </p>
                          )}
                          {activity.activityType === 'REMARK_ADDED' && (
                            <div className="mt-1.5 bg-white/4 border border-white/6 rounded-xl px-4 py-3 text-sm text-gray-300 leading-relaxed">
                              &quot;{activity.remark}&quot;
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add remark */}
                <div className="mt-6 pt-6 border-t border-white/6">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Add Remark</h3>
                  <textarea
                    rows={3}
                    className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-base md:text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 resize-none transition-all mb-3"
                    placeholder="Leave a note on this issue..."
                    value={newRemark}
                    onChange={e => setNewRemark(e.target.value)}
                  />
                  <button
                    onClick={handleAddRemark}
                    disabled={isSubmitting || !newRemark.trim()}
                    className="px-5 py-2.5 min-h-[44px] bg-white text-black rounded-xl text-sm font-semibold hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {isSubmitting ? 'Posting...' : 'Post Remark'}
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar — 1/3 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-5 lg:gap-5">
            {/* Properties */}
            <section className="bg-[#141414] border border-white/8 rounded-2xl overflow-hidden">
              <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-white/6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Properties</h3>
              </div>
              <div className="px-4 sm:px-5 py-4 space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Status</label>
                  <select
                    className="w-full min-h-[44px] bg-[#2a2a2a] border border-white/8 rounded-xl px-3 py-2.5 text-base md:text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    value={issue.status}
                    onChange={e => handleStatusChange(e.target.value)}
                    disabled={isSubmitting || issue.status === 'CLOSED'}
                  >
                    <option value="OPEN" className="bg-neutral-900">Open</option>
                    <option value="IN_PROGRESS" className="bg-neutral-900">In Progress</option>
                    <option value="WAITING" className="bg-neutral-900">Waiting</option>
                    <option value="RESOLVED" className="bg-neutral-900">Resolved</option>
                    <option value="CLOSED" className="bg-neutral-900">Closed</option>
                    <option value="CANCELLED" className="bg-neutral-900">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-2">Assigned To</label>
                  <div className="flex items-center gap-2 px-3 py-2.5 min-h-[44px] bg-white/4 border border-white/8 rounded-xl opacity-60">
                    <User size={13} className="text-gray-500 shrink-0" />
                    <span className="text-sm text-gray-300">{issue.assignedToId ? 'Staff Assigned' : 'Unassigned'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-2">Last Updated</label>
                  <div className="flex items-center gap-2 text-sm text-gray-300 min-h-[40px]">
                    <Clock size={13} className="text-gray-500 shrink-0" />
                    <span className="text-xs">{new Date(issue.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Order Details */}
            <section className="bg-[#141414] border border-white/8 rounded-2xl overflow-hidden">
              <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-white/6 flex justify-between items-center">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Order</h3>
                <button
                  onClick={handleOpenOrderModal}
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors p-1.5 min-h-[36px]"
                >
                  <span>View full</span>
                  <ExternalLink size={12} />
                </button>
              </div>
              <div className="px-4 sm:px-5 py-4 space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Order Number</label>
                  <div className="text-sm font-mono text-gray-200">{issue.orderNumber || issue.orderId}</div>
                </div>

                {issue.customerName && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Customer</label>
                    <div className="text-sm text-gray-200">{issue.customerName}</div>
                    {issue.customerEmail && <div className="text-xs text-gray-500 mt-0.5">{issue.customerEmail}</div>}
                  </div>
                )}

                {issue.totalPrice && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Total</label>
                    <div className="text-sm font-semibold text-gray-200">
                      {Number(issue.totalPrice).toLocaleString('en-US', {
                        style: 'currency',
                        currency: issue.currency || 'USD'
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
