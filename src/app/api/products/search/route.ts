import { NextResponse } from "next/server";
import { db } from "@/db";
import { orderItems } from "@/db/schema";
import { ilike } from "drizzle-orm";

export async function GET(req: Request) {
  try {
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
