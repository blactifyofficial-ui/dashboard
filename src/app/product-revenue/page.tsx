import { db } from'@/db';
import { orderItems } from'@/db/schema';
import { sql, desc, ilike } from'drizzle-orm';
import { ShoppingBag, ArrowUpRight } from'lucide-react';
import SearchInput from'@/components/SearchInput';
import Link from'next/link';

export const dynamic ="force-dynamic";

export default async function ProductRevenuePage(props: {
 searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
 const searchParams = await props.searchParams;
 const q = searchParams.q as string ||'';
 const page = parseInt(searchParams.page as string ||'1', 10);
 const pageSize = 15;
 const offset = (page - 1) * pageSize;

 const whereClause = q ? ilike(orderItems.title, `%${q}%`) : undefined;

 const [totalResult] = await db.select({
 totalProducts: sql<number>`count(distinct ${orderItems.title})`
 })
 .from(orderItems)
 .where(whereClause);

 const totalProducts = Number(totalResult.totalProducts) || 0;
 const totalPages = Math.ceil(totalProducts / pageSize);

 const productData = await db.select({
 title: orderItems.title,
 imageUrl: sql<string>`MAX(${orderItems.imageUrl})`,
 revenue: sql<number>`COALESCE(SUM(CAST(${orderItems.price} AS NUMERIC) * CAST(${orderItems.quantity} AS NUMERIC)), 0)`,
 unitsSold: sql<number>`COALESCE(SUM(CAST(${orderItems.quantity} AS NUMERIC)), 0)`
 })
 .from(orderItems)
 .where(whereClause)
 .groupBy(orderItems.title)
 .orderBy(desc(sql`COALESCE(SUM(CAST(${orderItems.price} AS NUMERIC) * CAST(${orderItems.quantity} AS NUMERIC)), 0)`))
 .limit(pageSize)
 .offset(offset);

 return (
 <div className="space-y-12 relative z-10">
 <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="space-y-2">
 <h1 className="text-4xl font-bold tracking-tight text-white">Product Revenue</h1>
 <p className="text-neutral-400 text-sm md:text-base">Breakdown of sales and units sold by product</p>
 </div>
 </header>

 <div className="bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-xl shadow-2xl relative">
 <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
 <div className="p-4 md:px-8 md:py-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
 <h2 className="text-xl font-semibold text-white tracking-tight">Product Performance</h2>
 <div className="w-full md:w-auto">
 <SearchInput initialQuery={q} />
 </div>
 </div>
 <div className="relative z-10 w-full">
 <table className="w-full text-sm text-left min-w-[600px]">
 <thead className="text-xs text-neutral-400 uppercase tracking-wider bg-white/[0.01] border-b border-white/5">
 <tr>
 <th className="px-4 md:px-8 py-4 md:py-5 font-semibold">Product</th>
 <th className="px-4 md:px-8 py-4 md:py-5 font-semibold text-center">Units Sold</th>
 <th className="px-4 md:px-8 py-4 md:py-5 font-semibold text-right">Revenue</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-white/5">
 {productData.length === 0 ? (
 <tr>
 <td colSpan={3} className="px-4 md:px-8 py-10 md:py-20 text-center text-neutral-400">
 <div className="flex flex-col items-center justify-center space-y-4">
 <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2 shadow-inner border border-white/5">
 <ShoppingBag size={32} className="text-white/50"/>
 </div>
 <p className="text-lg font-medium text-white/80">No product data available yet.</p>
 </div>
 </td>
 </tr>
 ) : (
 productData.map((data, idx) => (
 <tr key={idx} className="hover:bg-white/[0.03] transition-colors duration-200 group">
 <td className="px-4 md:px-8 py-4 md:py-5 font-medium text-white group-hover:text-neutral-300 transition-colors">
 <div className="flex items-center gap-3">
 {data.imageUrl ? (
 /* eslint-disable-next-line @next/next/no-img-element */
 <img src={data.imageUrl} alt={data.title || 'Product'} className="w-8 h-8 rounded-lg object-cover bg-white/5 border border-white/10 shrink-0" />
 ) : (
 <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
 {data.title ? data.title.charAt(0).toUpperCase() :'?'}
 </div>
 )}
 <Link href={`https://fvprhj-0y.myshopify.com/products/${data.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`} target="_blank" rel="noopener noreferrer" className="truncate hover:underline text-white flex items-center gap-1 group/link">
 {data.title ||'Unknown Product'}
 <ArrowUpRight size={14} className="opacity-50 group-hover/link:opacity-100 transition-opacity shrink-0" />
 </Link>
 </div>
 </td>
 <td className="px-4 md:px-8 py-4 md:py-5 text-white text-center">
 <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-white/5 border border-white/5">
 {Number(data.unitsSold)}
 </span>
 </td>
 <td className="px-4 md:px-8 py-4 md:py-5 text-right font-semibold text-white text-lg whitespace-nowrap">
 ₹{Number(data.revenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
 Showing <span className="font-medium text-white">{totalProducts === 0 ? 0 : offset + 1}</span> to <span className="font-medium text-white">{Math.min(offset + pageSize, totalProducts)}</span> of <span className="font-medium text-white">{totalProducts}</span> products
 </div>
 <div className="flex space-x-2">
 {page > 1 ? (
 <Link
 href={`/product-revenue?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` :''}`}
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
 href={`/product-revenue?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` :''}`}
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
