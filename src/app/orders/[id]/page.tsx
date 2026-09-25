import { db } from '@/db';
import { orders, orderItems, orderIssues, issueCategories, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';

export const dynamic = "force-dynamic";

export default async function OrderDetailPage(props: {
  params: Promise<{ id: string }>
}) {
  const params = await props.params;
  const orderId = params.id;

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
    <div className="p-8 max-w-7xl mx-auto text-black">
      <Link href="/orders" className="text-gray-400 hover:text-white mb-6 inline-block">
        &larr; Back to Orders
      </Link>
      
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Order #{order.orderNumber || order.id.substring(0,6)}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          
          <div className="bg-[#1e1e1e] p-6 rounded-xl border border-white/10 shadow-sm text-white">
            <h2 className="text-xl font-medium mb-4 border-b border-white/10 pb-2">Products</h2>
            {items.length === 0 ? (
              <p className="text-gray-400">No products found.</p>
            ) : (
              <ul className="divide-y divide-white/5">
                {items.map(item => (
                  <li key={item.id} className="py-3 flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={item.imageUrl} alt={item.title || 'Product'} className="w-10 h-10 rounded-lg object-cover bg-white/5 border border-white/10 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
                          {item.title ? item.title.charAt(0).toUpperCase() : '?'}
                        </div>
                      )}
                      <div>
                        <Link href={`https://fvprhj-0y.myshopify.com/products/${item.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline text-white flex items-center gap-1 group/link">
                          {item.title}
                          <ArrowUpRight size={14} className="opacity-50 group-hover/link:opacity-100 transition-opacity shrink-0" />
                        </Link>
                        <p className="text-sm text-gray-400">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="font-semibold shrink-0">
                      ₹{parseFloat(item.price as string || '0').toLocaleString('en-IN')}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-[#1e1e1e] p-6 rounded-xl border border-white/10 shadow-sm text-white">
            <h2 className="text-xl font-medium mb-4 border-b border-white/10 pb-2 flex items-center justify-between">
              <span>Issues ({issuesList.length})</span>
              <Link href="/order-issues" className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded transition-colors">
                Manage Issues
              </Link>
            </h2>
            {issuesList.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <p>This order currently has no reported issues.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {issuesList.map(issue => (
                  <Link href={`/order-issues/${issue.id}`} key={issue.id} className="block bg-[#2a2a2a] p-4 rounded-lg hover:bg-white/5 transition-colors border border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-lg">{issue.categoryName || 'Unknown Category'}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        issue.priority === 'URGENT' ? 'bg-red-500/20 text-red-400' :
                        issue.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {issue.priority}
                      </span>
                    </div>
                    <p className="text-gray-300 mb-3">{issue.title}</p>
                    <div className="flex gap-2 text-xs">
                      <span className={`px-2 py-1 rounded font-medium ${
                        issue.status === 'OPEN' ? 'bg-green-500/20 text-green-400' :
                        issue.status === 'IN_PROGRESS' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {issue.status.replace('_', ' ')}
                      </span>
                      <span className="bg-white/10 text-gray-300 px-2 py-1 rounded">
                        Assigned to {issue.assignedToName || 'Unassigned'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>

        <div className="space-y-8">
          <div className="bg-[#1e1e1e] p-6 rounded-xl border border-white/10 shadow-sm text-white">
            <h2 className="text-lg font-medium mb-4 border-b border-white/10 pb-2">Overview</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Customer</span>
                <span className="font-medium">{order.customerName || 'Guest'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Email</span>
                <span>{order.customerEmail || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Order Date</span>
                <span>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Unknown'}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#1e1e1e] p-6 rounded-xl border border-white/10 shadow-sm text-white">
            <h2 className="text-lg font-medium mb-4 border-b border-white/10 pb-2">Status</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Payment</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${order.financialStatus === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {order.financialStatus || 'pending'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Shipment</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${order.fulfillmentStatus === 'fulfilled' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {order.fulfillmentStatus || 'unfulfilled'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-white/5 mt-3">
                <span className="text-gray-400">Total</span>
                <span className="font-bold text-lg">₹{parseFloat(order.totalPrice as string || '0').toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
