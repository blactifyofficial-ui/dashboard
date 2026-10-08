import { db } from '@/db';
import { orders, orderItems, orderIssues, issueCategories, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { Suspense } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

import BackButton from '@/components/BackButton';

export const dynamic = "force-dynamic";

export default async function OrderDetailPage(props: {
  params: Promise<{ id: string }>
}) {
  const params = await props.params;
  const orderId = params.id;

  return (
    <div className="space-y-6 relative z-10 max-w-7xl mx-auto">
      <Suspense fallback={<LoadingSpinner />}>
        <OrderDetailContent orderId={orderId} />
      </Suspense>
    </div>
  );
}

async function OrderDetailContent({ orderId }: { orderId: string }) {
  const orderResult = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (orderResult.length === 0) {
    notFound();
  }
  const order = orderResult[0];

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  
  const issuesList = await db.select({
    id: orderIssues.id,
    title: orderIssues.title,
    priority: orderIssues.priority,
    status: orderIssues.status,
    categoryName: issueCategories.name,
    assignedToName: users.name,
  }).from(orderIssues)
    .leftJoin(issueCategories, eq(orderIssues.categoryId, issueCategories.id))
    .leftJoin(users, eq(orderIssues.assignedToId, users.id))
    .where(eq(orderIssues.orderId, orderId))
    .orderBy(desc(orderIssues.createdAt));

  return (
    <>
      <header className="flex items-center gap-3">
        <BackButton fallbackUrl="/revenue" iconOnly label="Back to Orders" />
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
            Order Details
          </h1>
          <p className="text-neutral-400 text-xs sm:text-sm font-mono">
            Order #{order.orderNumber || order.id.substring(0, 6)}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <div className="md:col-span-2 space-y-6">
          
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 sm:p-6 text-white">
            <h2 className="text-base font-semibold mb-4 border-b border-neutral-800 pb-2.5">Products</h2>
            {items.length === 0 ? (
              <p className="text-neutral-400 text-sm">No products found.</p>
            ) : (
              <ul className="divide-y divide-neutral-800/60">
                {items.map(item => (
                  <li key={item.id} className="py-3 flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={item.imageUrl} alt={item.title || 'Product'} className="w-10 h-10 rounded-lg object-cover bg-neutral-900 border border-neutral-800 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-700/60 flex items-center justify-center text-white shrink-0 text-xs font-semibold">
                          {item.title ? item.title.charAt(0).toUpperCase() : '?'}
                        </div>
                      )}
                      <div>
                        <Link href={`https://fvprhj-0y.myshopify.com/products/${item.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline text-white flex items-center gap-1 group/link">
                          <span>{item.title}</span>
                          <ArrowUpRight size={13} className="text-neutral-500 group-hover/link:text-white transition-colors shrink-0" />
                        </Link>
                        <p className="text-xs text-neutral-400 mt-0.5">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="font-medium font-mono text-sm shrink-0">
                      ₹{parseFloat(item.price as string || '0').toLocaleString('en-IN')}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 sm:p-6 text-white">
            <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-2.5">
              <h2 className="text-base font-semibold">Issues ({issuesList.length})</h2>
              <Link href="/order-issues" className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/60 px-2.5 py-1 rounded-md transition-colors">
                Manage Issues
              </Link>
            </div>
            {issuesList.length === 0 ? (
              <div className="text-center py-6 text-neutral-400 text-sm">
                <p>This order currently has no reported issues.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {issuesList.map(issue => (
                  <Link href={`/order-issues/${issue.id}`} key={issue.id} className="block bg-neutral-900 p-3.5 rounded-lg hover:bg-neutral-800/80 transition-colors border border-neutral-800">
                    <div className="flex justify-between items-start mb-1.5">
                      <h3 className="font-medium text-sm text-white">{issue.categoryName || 'Unknown Category'}</h3>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        issue.priority === 'URGENT' ? 'bg-red-500/15 text-red-400 border border-red-500/25' :
                        issue.priority === 'HIGH' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/25' :
                        'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                      }`}>
                        {issue.priority}
                      </span>
                    </div>
                    <p className="text-neutral-300 text-xs mb-2.5">{issue.title}</p>
                    <div className="flex gap-2 text-xs">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        issue.status === 'OPEN' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' :
                        issue.status === 'IN_PROGRESS' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' :
                        'bg-neutral-800 text-neutral-400 border border-neutral-700'
                      }`}>
                        {issue.status.replace('_', ' ')}
                      </span>
                      <span className="bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded text-[11px] border border-neutral-700/60">
                        Assigned to {issue.assignedToName || 'Unassigned'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>

        <div className="space-y-6">
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 sm:p-6 text-white">
            <h2 className="text-base font-semibold mb-4 border-b border-neutral-800 pb-2.5">Overview</h2>
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-400">Customer</span>
                <span className="font-medium text-white">{order.customerName || 'Guest'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Email</span>
                <span className="text-neutral-300 truncate max-w-[160px]">{order.customerEmail || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Order Date</span>
                <span className="text-neutral-300">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Unknown'}</span>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 sm:p-6 text-white">
            <h2 className="text-base font-semibold mb-4 border-b border-neutral-800 pb-2.5">Status</h2>
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Payment</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${order.financialStatus === 'paid' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-neutral-800 text-neutral-400 border border-neutral-700'}`}>
                  {order.financialStatus || 'pending'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Shipment</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${order.fulfillmentStatus === 'fulfilled' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25' : 'bg-neutral-800 text-neutral-400 border border-neutral-700'}`}>
                  {order.fulfillmentStatus || 'unfulfilled'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Courier</span>
                {order.trackingUrl ? (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline transition-colors font-medium text-xs group"
                  >
                    <span>{order.trackingCompany || 'Track Shipment'}</span>
                    <ArrowUpRight size={12} className="opacity-75 group-hover:opacity-100 shrink-0" />
                  </a>
                ) : (
                  <span className="text-neutral-300 font-medium text-xs">
                    {order.trackingCompany || (order.fulfillmentStatus === 'fulfilled' ? 'Standard' : '-')}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Tracking ID</span>
                {order.trackingId ? (
                  order.trackingUrl ? (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/60 px-2 py-0.5 rounded text-neutral-200 font-medium inline-flex items-center gap-1 transition-colors select-all"
                    >
                      <span>{order.trackingId}</span>
                      <ArrowUpRight size={10} className="opacity-60 shrink-0" />
                    </a>
                  ) : (
                    <span className="font-mono text-xs bg-neutral-800 border border-neutral-700/60 px-2 py-0.5 rounded text-neutral-200 font-medium select-all">
                      {order.trackingId}
                    </span>
                  )
                ) : (
                  <span className="text-neutral-500 text-xs italic">
                    {order.fulfillmentStatus === 'fulfilled' ? 'Not provided' : 'Unassigned'}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-neutral-800 mt-3">
                <span className="text-neutral-400 font-medium">Total</span>
                <span className="font-semibold font-mono text-base text-white">₹{parseFloat(order.totalPrice as string || '0').toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

