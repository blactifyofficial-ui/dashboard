import { db } from'@/db';
import { orders } from'@/db/schema';
import { sql, desc, ilike } from'drizzle-orm';
import { CalendarDays } from'lucide-react';
import SearchInput from'@/components/SearchInput';

export const dynamic ="force-dynamic";

export default async function RevenuePage(props: {
 searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
 const searchParams = await props.searchParams;
 const q = searchParams.q as string ||'';

 const whereClause = q ? ilike(sql<string>`to_char(${orders.createdAt},'FMMonth YYYY')`, `%${q}%`) : undefined;

 const monthlyData = await db.select({
 month: sql<string>`to_char(date_trunc('month', ${orders.createdAt}),'YYYY-MM')`,
 revenue: sql<number>`COALESCE(SUM(CAST(${orders.totalPrice} AS NUMERIC)), 0)`,
 orderCount: sql<number>`COUNT(*)`
 })
 .from(orders)
 .where(whereClause)
 .groupBy(sql`date_trunc('month', ${orders.createdAt})`)
 .orderBy(desc(sql`date_trunc('month', ${orders.createdAt})`));

 const maxRevenue = Math.max(...monthlyData.map(d => Number(d.revenue)), 0);

 return (
 <div className="space-y-12 relative z-10">
 <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="space-y-2">
 <h1 className="text-4xl font-bold tracking-tight text-white">Monthly Revenue</h1>
 <p className="text-neutral-400 text-sm md:text-base">Breakdown of sales and orders by month</p>
 </div>
 </header>

 <div className="bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-xl shadow-2xl relative">
 <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
 <div className="p-4 md:px-8 md:py-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
 <h2 className="text-xl font-semibold text-white tracking-tight">Monthly Breakdown</h2>
 <div className="w-full md:w-auto">
 <SearchInput initialQuery={q} />
 </div>
 </div>
 <div className="p-4 md:p-6 space-y-3 relative z-10">
 {monthlyData.length === 0 ? (
 <div className="py-20 text-center text-neutral-400 flex flex-col items-center justify-center space-y-4">
 <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2 shadow-inner border border-white/5">
 <CalendarDays size={32} className="text-white/50"/>
 </div>
 <p className="text-lg font-medium text-white/80">No data available yet.</p>
 </div>
 ) : (
 monthlyData.map((data, idx) => {
 const [year, month] = (data.month ||'').split('-');
 const dateObj = year && month ? new Date(parseInt(year), parseInt(month) - 1) : null;
 const monthDisplay = dateObj ? dateObj.toLocaleDateString('en-US', { month:'long', year:'numeric'}) :'Unknown';
 const monthShort = dateObj ? dateObj.toLocaleDateString('en-US', { month:'short'}) :'-';
 
 const revenueNum = Number(data.revenue);
 const percent = maxRevenue > 0 ? (revenueNum / maxRevenue) * 100 : 0;

 return (
 <div key={idx} className="group relative bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all duration-300 shadow-sm hover:shadow-xl">
 {/* Progress Bar Background */}
 <div 
 className="absolute inset-y-0 left-0 bg-white/[0.05] group-hover:bg-white/[0.08] transition-all duration-700 ease-out z-0"
 style={{ width: `${percent}%` }}
 ></div>
 
 {/* Content */}
 <div className="relative z-10 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center shadow-lg group-hover:scale-105 group-hover:bg-white/10 transition-all duration-300">
 <span className="text-xs text-white font-bold tracking-wider uppercase">{monthShort}</span>
 </div>
 <div>
 <h3 className="text-lg font-semibold text-white tracking-tight">{monthDisplay}</h3>
 <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-2">
 <span className="w-1.5 h-1.5 rounded-full bg-white/40 group-hover:bg-white transition-colors duration-300"></span>
 {Number(data.orderCount)} {Number(data.orderCount) === 1 ?'order':'orders'} completed
 </p>
 </div>
 </div>
 
 <div className="flex flex-col md:items-end">
 <p className="text-[10px] font-medium text-neutral-500 mb-0.5 uppercase tracking-wider">Revenue</p>
 <p className="text-xl md:text-2xl font-bold text-white tracking-tight">
 ₹{revenueNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
 </p>
 </div>
 </div>
 </div>
 );
 })
 )}
 </div>
 </div>
 </div>
 );
}
