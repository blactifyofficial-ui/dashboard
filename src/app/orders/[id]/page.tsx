import { db } from '@/db';
import { orders, orderItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { Suspense } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import BackButton from '@/components/BackButton';
import { isCodOrder, getCodAmountToCollect, getPrepaidAmount } from '@/lib/order-utils';
import OrderCodCard from '@/components/cod/OrderCodCard';
import { requirePermission } from '@/lib/auth-utils';
import AccessDenied from '@/components/AccessDenied';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const dynamic = "force-dynamic";

export default async function OrderDetailPage(props: {
  params: Promise<{ id: string }>
}) {
  const authRes = await requirePermission('orders:view');
  if ('error' in authRes) {
    return <AccessDenied message="You do not have permission to view order details." />;
  }

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

  const isCod = isCodOrder(order);

  return (
    <>
      <header className="flex items-center gap-3">
        <BackButton fallbackUrl="/revenue" iconOnly label="Back to Orders" />
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Order Details
            </h1>
            <Badge variant={isCod ? 'warning' : 'success'} size="sm" dot>
              {isCod ? 'COD Order' : 'Prepaid Order'}
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm font-mono">
            Order #{order.orderNumber || order.id.substring(0, 6)}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-semibold">Products ({items.length})</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {items.length === 0 ? (
                <p className="text-muted-foreground text-sm">No products found in this order.</p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {items.map(item => (
                    <li key={item.id} className="py-3 flex justify-between items-center gap-4">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-muted border border-border shrink-0">
                            <Image
                              src={item.imageUrl}
                              alt={item.title || 'Product'}
                              fill
                              sizes="44px"
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-muted border border-border flex items-center justify-center text-foreground shrink-0 text-xs font-semibold">
                            {item.title ? item.title.charAt(0).toUpperCase() : '?'}
                          </div>
                        )}
                        <div>
                          <Link href={`https://fvprhj-0y.myshopify.com/products/${item.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline text-foreground flex items-center gap-1 group/link">
                            <span>{item.title}</span>
                            <ArrowUpRight size={13} className="text-muted-foreground group-hover/link:text-foreground transition-colors shrink-0" />
                          </Link>
                          <p className="text-xs text-muted-foreground mt-0.5 font-mono">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="font-semibold font-mono text-sm shrink-0 text-foreground">
                        ₹{parseFloat(item.price as string || '0').toLocaleString('en-IN')}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-semibold">Customer Overview</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-medium text-foreground">{order.customerName || 'Guest'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Email</span>
                <span className="text-foreground truncate max-w-[170px] font-mono text-xs">{order.customerEmail || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Order Date</span>
                <span className="text-foreground font-mono text-xs">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Unknown'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-semibold">Fulfillment &amp; Payment Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Payment</span>
                <Badge variant={order.financialStatus === 'paid' ? 'success' : order.financialStatus === 'partially_paid' ? 'warning' : 'neutral'} size="sm">
                  {order.financialStatus || 'pending'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Shipment</span>
                <Badge variant={order.fulfillmentStatus === 'fulfilled' ? 'info' : 'neutral'} size="sm">
                  {order.fulfillmentStatus || 'unfulfilled'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Courier</span>
                {order.trackingUrl ? (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline transition-colors font-medium text-xs group"
                  >
                    <span>{order.trackingCompany || 'Track Shipment'}</span>
                    <ArrowUpRight size={12} className="opacity-75 group-hover:opacity-100 shrink-0" />
                  </a>
                ) : (
                  <span className="text-foreground font-medium text-xs">
                    {order.trackingCompany || (order.fulfillmentStatus === 'fulfilled' ? 'Standard' : '-')}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tracking ID</span>
                {order.trackingId ? (
                  order.trackingUrl ? (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs bg-muted hover:bg-muted/80 border border-border px-2 py-0.5 rounded text-foreground font-medium inline-flex items-center gap-1 transition-colors select-all"
                    >
                      <span>{order.trackingId}</span>
                      <ArrowUpRight size={10} className="opacity-60 shrink-0" />
                    </a>
                  ) : (
                    <span className="font-mono text-xs bg-muted border border-border px-2 py-0.5 rounded text-foreground font-medium select-all">
                      {order.trackingId}
                    </span>
                  )
                ) : (
                  <span className="text-muted-foreground text-xs italic">
                    {order.fulfillmentStatus === 'fulfilled' ? 'Not provided' : 'Unassigned'}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-border mt-3">
                <span className="text-muted-foreground font-medium">Total Price</span>
                <span className="font-bold font-mono text-base text-foreground">₹{parseFloat(order.totalPrice as string || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              {order.financialStatus === 'partially_paid' && (
                <>
                  <div className="flex justify-between items-center text-xs text-emerald-600 dark:text-emerald-400">
                    <span>Paid Online (Advance)</span>
                    <span className="font-mono font-medium">
                      ₹{getPrepaidAmount(order).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    <span>Balance (To Collect)</span>
                    <span className="font-mono">
                      ₹{getCodAmountToCollect(order).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {isCod && (
            <OrderCodCard order={order} />
          )}
        </div>
      </div>
    </>
  );
}
