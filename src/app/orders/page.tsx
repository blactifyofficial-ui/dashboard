import { db } from'@/db';
import { orders } from'@/db/schema';
import { desc, count, ilike, or } from'drizzle-orm';
import Link from'next/link';
import { Inbox } from'lucide-react';
import SearchInput from'@/components/SearchInput';

export const dynamic ="force-dynamic";

export default async function OrdersPage(props: {
 searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
 const searchParams = await props.searchParams;
 const page = parseInt(searchParams.page as string ||'1', 10);
 const q = searchParams.q as string ||'';
 const pageSize = 15;
 const offset = (page - 1) * pageSize;

 const whereClause = q ? or(
 ilike(orders.customerName, `%${q}%`),
 ilike(orders.customerEmail, `%${q}%`),
 ilike(orders.orderNumber, `%${q}%`)
 ) : undefined;

 const [totalResult] = await db.select({
 totalOrders: count(),
 }).from(orders).where(whereClause);

 const totalOrders = totalResult.totalOrders;
 const totalPages = Math.ceil(totalOrders / pageSize);

 const allOrders = await db.select().from(orders).where(whereClause).orderBy(desc(orders.createdAt)).limit(pageSize).offset(offset);
 
 return (
 <div className="space-y-12 relative z-10">
 <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="space-y-2">
 <h1 className="text-4xl font-bold tracking-tight text-white">All Orders</h1>
 <p className="text-neutral-400 text-sm md:text-base">Complete history of all transactions</p>
 </div>
 </header>

 {/* Orders Table */}
 <div className="bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-xl shadow-2xl relative">
 <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
 <div className="p-4 md:px-8 md:py-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
 <h2 className="text-xl font-semibold text-white tracking-tight">Order Log</h2>
 <div className="w-full md:w-auto">
 <SearchInput initialQuery={q} />
 </div>
 </div>
 <div className="relative z-10 w-full overflow-x-auto no-scrollbar">
 <table className="w-full text-sm text-left min-w-[800px]">
 <thead className="text-xs text-neutral-400 uppercase tracking-wider bg-white/[0.01] border-b border-white/5">
 <tr>
 <th className="px-4 md:px-8 py-4 md:py-5 font-semibold">Order</th>
 <th className="px-4 md:px-8 py-4 md:py-5 font-semibold">Customer</th>
 <th className="px-4 md:px-8 py-4 md:py-5 font-semibold">Date</th>
 <th className="px-4 md:px-8 py-4 md:py-5 font-semibold">Payment</th>
 <th className="px-4 md:px-8 py-4 md:py-5 font-semibold">Status</th>
 <th className="px-4 md:px-8 py-4 md:py-5 font-semibold text-right">Total</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-white/5">
 {allOrders.length === 0 ? (
 <tr>
 <td colSpan={6} className="px-4 md:px-8 py-10 md:py-20 text-center text-neutral-400">
 <div className="flex flex-col items-center justify-center space-y-4">
 <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2 shadow-inner border border-white/5">
 <Inbox size={32} className="text-white/50"/>
 </div>
 <p className="text-lg font-medium text-white/80">No orders found yet.</p>
 </div>
 </td>
 </tr>
 ) : (
 allOrders.map((order) => (
 <tr 
 key={order.id} 
 className="hover:bg-white/[0.03] transition-colors duration-200 group"
 >
 <td className="px-4 md:px-8 py-4 md:py-5 font-medium text-white group-hover:text-neutral-300 transition-colors">
   <Link href={`/orders/${order.id}`} className="hover:underline">#{order.orderNumber || order.id.substring(0,6)}</Link>
 </td>
 <td className="px-4 md:px-8 py-4 md:py-5">
 <div className="text-white font-medium">{order.customerName ||'Guest'}</div>
 <div className="text-xs text-neutral-400 mt-1">{order.customerEmail ||'No email provided'}</div>
 </td>
 <td className="px-4 md:px-8 py-4 md:py-5 text-neutral-300">
 {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric'}) :'Unknown'}
 </td>
 <td className="px-4 md:px-8 py-4 md:py-5">
 <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${
 order.financialStatus ==='paid'?'bg-white/10 text-white border-white/20': 
'bg-neutral-800 text-neutral-300 border-neutral-700'
 }`}>
 <span className={`w-1.5 h-1.5 rounded-full mr-2 ${order.financialStatus ==='paid'?'bg-white':'bg-neutral-400'}`}></span>
 {order.financialStatus ||'pending'}
 </span>
 </td>
 <td className="px-4 md:px-8 py-4 md:py-5">
 <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${
 order.fulfillmentStatus ==='fulfilled'?'bg-white/10 text-white border-white/20': 
'bg-neutral-800 text-neutral-400 border-neutral-700'
 }`}>
 <span className={`w-1.5 h-1.5 rounded-full mr-2 ${order.fulfillmentStatus ==='fulfilled'?'bg-white':'bg-neutral-400'}`}></span>
 {order.fulfillmentStatus ||'unfulfilled'}
 </span>
 </td>
 <td className="px-4 md:px-8 py-4 md:py-5 text-right font-semibold text-white">
 {order.totalPrice ? `₹${parseFloat(order.totalPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` :'-'}
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 
 {totalPages > 1 && (
 <div className="p-4 md:px-8 md:py-5 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/[0.01] relative z-10">
 <div className="text-sm text-neutral-400">
 Showing <span className="font-medium text-white">{offset + 1}</span> to <span className="font-medium text-white">{Math.min(offset + pageSize, totalOrders)}</span> of <span className="font-medium text-white">{totalOrders}</span> orders
 </div>
 <div className="flex space-x-2">
 {page > 1 ? (
 <Link
 href={`/orders?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` :''}`}
 className="px-5 py-2 border border-white/10 bg-white/5 text-white rounded-xl hover:bg-white/10 text-sm font-medium transition-all backdrop-blur-sm"
 >
 Previous
 </Link>
 ) : (
 <button disabled className="px-5 py-2 border border-white/5 bg-transparent text-neutral-600 rounded-xl text-sm font-medium cursor-not-allowed opacity-50">
 Previous
 </button>
 )}
 
 {page < totalPages ? (
 <Link
 href={`/orders?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` :''}`}
 className="px-5 py-2 border border-white/10 bg-white/5 text-white rounded-xl hover:bg-white/10 text-sm font-medium transition-all backdrop-blur-sm"
 >
 Next
 </Link>
 ) : (
 <button disabled className="px-5 py-2 border border-white/5 bg-transparent text-neutral-600 rounded-xl text-sm font-medium cursor-not-allowed opacity-50">
 Next
 </button>
 )}
 </div>
 </div>
 )}
 </div>
 </div>
 );
}
