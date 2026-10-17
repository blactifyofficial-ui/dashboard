import { NextResponse } from "next/server";
import { db } from "@/db";
import { orderItems } from "@/db/schema";
import { ilike } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";
import { hasPermission } from "@/lib/rbac";

export async function GET(req: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const canView = hasPermission(authResult.role, 'revenue:view_products', authResult.permissions) ||
      hasPermission(authResult.role, 'overview:view_top_products', authResult.permissions) ||
      hasPermission(authResult.role, 'revenue:view', authResult.permissions);
    if (!canView) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const url = new URL(req.url);
    const q = url.searchParams.get("q");

    if (!q || q.length < 2) {
      return NextResponse.json([]);
    }

    // We search the orderItems for product titles since we don't have a dedicated products table.
    // In a real scenario with a products table, you would query that instead.
    const products = await db.selectDistinct({
      id: orderItems.shopifyProductId,
      title: orderItems.title,
      imageUrl: orderItems.imageUrl,
    })
    .from(orderItems)
    .where(ilike(orderItems.title, `%${q}%`))
    .limit(10);

    return NextResponse.json(products);
  } catch (error) {
    console.error("Search failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
