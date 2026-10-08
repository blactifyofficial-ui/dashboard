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
    OPEN: 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30',
    IN_PROGRESS: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30',
    WAITING: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30',
    RESOLVED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
    CLOSED: 'bg-muted text-muted-foreground border border-border',
    CANCELLED: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium tracking-wide ${map[status] || map.OPEN}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    URGENT: 'bg-rose-500',
    HIGH: 'bg-amber-500',
    MEDIUM: 'bg-yellow-500',
    LOW: 'bg-neutral-500',
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${map[priority] || 'bg-neutral-500'}`} />;
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
      <p className="text-muted-foreground">Issue not found.</p>
    </div>
  );

  return (
    <div className="min-h-screen text-foreground">
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
            <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-border bg-muted/20 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-foreground">Order Details</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Full Shopify order information</p>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={15} />
              </button>
            </div>
            <div className="p-4 sm:p-5 overflow-y-auto flex-1">
              {loadingOrder ? (
                <LoadingSpinner size="small" />
              ) : shopifyOrder ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-background border border-border rounded-lg p-3.5 space-y-2.5">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Order Info</p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="text-xs text-muted-foreground">Number</span>
                          <span className="text-xs font-mono font-medium text-foreground">{shopifyOrder.order_number || shopifyOrder.name}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs text-muted-foreground">Date</span>
                          <span className="text-xs text-foreground text-right">{new Date(shopifyOrder.created_at).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Payment</span>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 uppercase">
                            {shopifyOrder.financial_status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Fulfillment</span>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 uppercase">
                            {shopifyOrder.fulfillment_status || 'UNFULFILLED'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-background border border-border rounded-lg p-3.5 space-y-2.5">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Customer & Shipping</p>
                      <div>
                        <span className="text-xs text-muted-foreground">Customer</span>
                        <div className="text-xs font-medium text-foreground mt-0.5">
                          {shopifyOrder.customer ? `${shopifyOrder.customer.first_name || ''} ${shopifyOrder.customer.last_name || ''}` : 'N/A'}
                        </div>
                        {shopifyOrder.customer?.email && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span className="truncate">{shopifyOrder.customer.email}</span>
                            <a href={`mailto:${shopifyOrder.customer.email}`} className="p-1 text-muted-foreground hover:text-foreground shrink-0" title="Mail">
                              <Mail size={13} />
                            </a>
                          </div>
                        )}
                        {shopifyOrder.customer?.phone && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{shopifyOrder.customer.phone}</span>
                            <a href={`tel:${shopifyOrder.customer.phone}`} className="p-1 text-muted-foreground hover:text-foreground" title="Call">
                              <Phone size={13} />
                            </a>
                            <a href={`https://wa.me/${shopifyOrder.customer.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-1 text-emerald-600 dark:text-emerald-400 hover:opacity-80" title="WhatsApp">
                              <MessageCircle size={13} />
                            </a>
                          </div>
                        )}
                      </div>
                      {shopifyOrder.shipping_address && (
                        <div className="pt-1 border-t border-border">
                          <span className="text-xs text-muted-foreground">Shipping Address</span>
                          <div className="text-xs text-foreground mt-1 leading-snug">
                            {shopifyOrder.shipping_address.name}<br/>
                            {shopifyOrder.shipping_address.address1}<br/>
                            {shopifyOrder.shipping_address.address2 && <>{shopifyOrder.shipping_address.address2}<br/></>}
                            {shopifyOrder.shipping_address.city}, {shopifyOrder.shipping_address.province} {shopifyOrder.shipping_address.zip}<br/>
                            {shopifyOrder.shipping_address.country}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Line Items</p>
                    <div className="border border-border rounded-lg overflow-x-auto">
                      <table className="w-full min-w-[360px] text-xs text-left">
                        <thead className="bg-muted/30 border-b border-border">
                          <tr>
                            <th className="px-3 py-2 text-muted-foreground font-medium">Product</th>
                            <th className="px-3 py-2 text-muted-foreground font-medium">SKU</th>
                            <th className="px-3 py-2 text-muted-foreground font-medium text-right">Qty</th>
                            <th className="px-3 py-2 text-muted-foreground font-medium text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {shopifyOrder.line_items?.map((item: ShopifyLineItem) => (
                            <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-3 py-2.5">
                                <div className="text-foreground font-medium">{item.title}</div>
                                {item.variant_title && <div className="text-[11px] text-muted-foreground mt-0.5">{item.variant_title}</div>}
                              </td>
                              <td className="px-3 py-2.5 text-muted-foreground font-mono">{item.sku || '—'}</td>
                              <td className="px-3 py-2.5 text-right text-foreground">{item.quantity}</td>
                              <td className="px-3 py-2.5 text-right font-medium text-foreground">
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
                      <div className="text-xs text-muted-foreground mb-0.5">Total Price</div>
                      <div className="text-lg font-bold text-foreground">
                        {Number(shopifyOrder.current_total_price).toLocaleString('en-US', { style: 'currency', currency: shopifyOrder.currency || 'USD' })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <p className="text-muted-foreground text-sm">Order not found in Shopify.</p>
                </div>
              )}
            </div>
            <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-t border-border flex justify-end shrink-0">
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="px-4 py-2 min-h-[38px] bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors text-xs font-medium border border-border"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-5 sm:py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-foreground border border-border">
                <Tag size={11} />
                {issue.category}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-foreground border border-border">
                <PriorityDot priority={issue.priority} />
                {issue.priority}
              </span>
              <StatusBadge status={issue.status} />
            </div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-foreground mb-1">{issue.title}</h1>
            <p className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
              <Hash size={12} />
              {issue.id.slice(0, 8)}
            </p>
          </div>
          
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[38px] border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300 rounded-lg hover:bg-rose-500/20 text-xs font-medium transition-colors shrink-0 w-full sm:w-auto"
          >
            <Trash2 size={13} />
            <span>Delete Issue</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Main content — 2/3 */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5">

            {/* Description */}
            <section className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
              <div className="px-4 sm:px-5 py-3 border-b border-border bg-muted/20">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</h2>
              </div>
              <div className="px-4 sm:px-5 py-4">
                <p className="text-foreground whitespace-pre-wrap leading-relaxed text-sm">{issue.description}</p>
              </div>
            </section>

            {/* Activity timeline */}
            <section className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
              <div className="px-4 sm:px-5 py-3 border-b border-border bg-muted/20">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activity</h2>
              </div>
              <div className="px-4 sm:px-5 py-4">
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-[7px] top-2 bottom-0 w-px bg-border" />

                  <div className="space-y-0">
                    {issue.activities.map((activity, idx) => (
                      <div key={activity.id} className="flex gap-4 relative pb-5 last:pb-0">
                        {/* Dot */}
                        <div className="relative z-10 shrink-0 mt-1">
                          {activity.activityType === 'CREATED' && (
                            <div className="w-3.5 h-3.5 rounded-full bg-blue-500 ring-4 ring-card" />
                          )}
                          {activity.activityType === 'STATUS_CHANGED' && (
                            <div className="w-3.5 h-3.5 rounded-full bg-purple-500 ring-4 ring-card" />
                          )}
                          {activity.activityType === 'REMARK_ADDED' && (
                            <div className="w-3.5 h-3.5 rounded-full bg-muted-foreground ring-4 ring-card" />
                          )}
                          {!['CREATED', 'STATUS_CHANGED', 'REMARK_ADDED'].includes(activity.activityType) && (
                            <div className="w-3.5 h-3.5 rounded-full bg-muted-foreground ring-4 ring-card" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0" style={{ marginTop: idx === 0 ? 0 : undefined }}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground">
                              {new Date(activity.createdAt).toLocaleString()}
                            </span>
                            <span className="text-border">·</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <User size={11} />
                              {activity.actorId === 'unassigned' ? 'System' : 'Staff'}
                            </span>
                          </div>

                          {activity.activityType === 'CREATED' && (
                            <p className="text-xs text-foreground">
                              Issue created and marked as <span className="text-blue-600 dark:text-blue-300 font-medium">{activity.newStatus}</span>
                            </p>
                          )}
                          {activity.activityType === 'STATUS_CHANGED' && (
                            <div className="text-xs text-foreground flex items-center gap-2 flex-wrap">
                              <span>Status changed</span>
                              <span className="text-muted-foreground line-through text-xs">{activity.oldStatus}</span>
                              <span className="text-muted-foreground">→</span>
                              <StatusBadge status={activity.newStatus || ''} />
                            </div>
                          )}
                          {activity.activityType === 'REMARK_ADDED' && (
                            <div className="mt-1.5 bg-muted/40 border border-border rounded-lg px-3.5 py-2.5 text-xs text-foreground leading-relaxed">
                              &quot;{activity.remark}&quot;
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add remark */}
                <div className="mt-5 pt-4 border-t border-border">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Add Remark</h3>
                  <textarea
                    rows={3}
                    className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors resize-none mb-2.5"
                    placeholder="Leave a note on this issue..."
                    value={newRemark}
                    onChange={e => setNewRemark(e.target.value)}
                  />
                  <button
                    onClick={handleAddRemark}
                    disabled={isSubmitting || !newRemark.trim()}
                    className="px-4 py-2 min-h-[38px] bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-xs"
                  >
                    {isSubmitting ? 'Posting...' : 'Post Remark'}
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar — 1/3 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-5">
            {/* Properties */}
            <section className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
              <div className="px-4 sm:px-5 py-3 border-b border-border bg-muted/20">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Properties</h3>
              </div>
              <div className="px-4 sm:px-5 py-3.5 space-y-3.5">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Status</label>
                  <select
                    className="w-full min-h-[38px] bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    value={issue.status}
                    onChange={e => handleStatusChange(e.target.value)}
                    disabled={isSubmitting || issue.status === 'CLOSED'}
                  >
                    <option value="OPEN" className="bg-popover text-popover-foreground">Open</option>
                    <option value="IN_PROGRESS" className="bg-popover text-popover-foreground">In Progress</option>
                    <option value="WAITING" className="bg-popover text-popover-foreground">Waiting</option>
                    <option value="RESOLVED" className="bg-popover text-popover-foreground">Resolved</option>
                    <option value="CLOSED" className="bg-popover text-popover-foreground">Closed</option>
                    <option value="CANCELLED" className="bg-popover text-popover-foreground">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Assigned To</label>
                  <div className="flex items-center gap-2 px-3 py-2 min-h-[38px] bg-muted/30 border border-border rounded-lg">
                    <User size={13} className="text-muted-foreground shrink-0" />
                    <span className="text-xs text-foreground">{issue.assignedToId ? 'Staff Assigned' : 'Unassigned'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Last Updated</label>
                  <div className="flex items-center gap-2 text-xs text-foreground min-h-[32px]">
                    <Clock size={13} className="text-muted-foreground shrink-0" />
                    <span>{new Date(issue.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Order Details */}
            <section className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
              <div className="px-4 sm:px-5 py-3 border-b border-border bg-muted/20 flex justify-between items-center">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order</h3>
                <button
                  onClick={handleOpenOrderModal}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  <span>View full</span>
                  <ExternalLink size={12} />
                </button>
              </div>
              <div className="px-4 sm:px-5 py-3.5 space-y-3.5">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Order Number</label>
                  <div className="text-xs font-mono font-medium text-foreground">{issue.orderNumber || issue.orderId}</div>
                </div>

                {issue.customerName && (
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Customer</label>
                    <div className="text-xs font-medium text-foreground">{issue.customerName}</div>
                    {issue.customerEmail && <div className="text-[11px] text-muted-foreground mt-0.5">{issue.customerEmail}</div>}
                  </div>
                )}

                {issue.totalPrice && (
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Total</label>
                    <div className="text-sm font-semibold text-foreground">
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
