import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { inventory } from "@/db/schema";
import { desc, sql, ilike, or, and, gt, lte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "All";
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(inventory.title, `%${search}%`),
          ilike(inventory.sku, `%${search}%`)
        )
      );
    }

    if (status === "In Stock") {
      conditions.push(gt(inventory.inventoryQuantity, "10"));
    } else if (status === "Low Stock") {
      conditions.push(and(gt(inventory.inventoryQuantity, "0"), lte(inventory.inventoryQuantity, "10")));
    } else if (status === "Out of Stock") {
      conditions.push(lte(inventory.inventoryQuantity, "0"));
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(inventory)
      .where(whereCondition);
      
    const totalCount = Number(totalCountResult.count);
    const totalPages = Math.ceil(totalCount / pageSize);

    const items = await db.select()
      .from(inventory)
      .where(whereCondition)
      .orderBy(desc(inventory.createdAt))
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({
      data: items,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
      }
    });
  } catch (error) {
    console.error("Failed to load inventory:", error);
    return NextResponse.json({ error: "Failed to load inventory" }, { status: 500 });
  }
}
