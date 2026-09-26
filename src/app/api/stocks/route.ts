import { NextResponse } from "next/server";
import { db } from "@/db";
import { stocks } from "@/db/schema";
import { desc } from "drizzle-orm";
// Assume user auth is handled by Neon Auth as seen in package.json
// import { requireAuth } from "@/lib/auth/auth-utils";

export async function GET() {
  try {
    const allStocks = await db.select().from(stocks).orderBy(desc(stocks.createdAt));
    return NextResponse.json(allStocks);
  } catch {
    return NextResponse.json({ error: "Failed to load stocks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // const user = await requireAuth();
    const body = await req.json();
    
    // Validation
    if (!body.buyingPrice || body.buyingPrice <= 0) {
      return NextResponse.json({ error: "Invalid buying price" }, { status: 400 });
    }
    if (!body.sellingPrice || body.sellingPrice <= 0) {
      return NextResponse.json({ error: "Invalid selling price" }, { status: 400 });
    }
    if (!body.stockCount || body.stockCount < 1 || !Number.isInteger(Number(body.stockCount))) {
      return NextResponse.json({ error: "Invalid stock count" }, { status: 400 });
    }

    const totalPurchaseAmount = Number(body.stockCount) * Number(body.buyingPrice);
    const expectedReturn = Number(body.stockCount) * Number(body.sellingPrice);

    // ID generation could be uuid
    const id = crypto.randomUUID();

    await db.insert(stocks).values({
      id,
      productImage: body.productImage || null,
      buyingPrice: String(body.buyingPrice),
      stockCount: String(body.stockCount),
      sellingPrice: String(body.sellingPrice),
      productId: body.productId || null,
      totalPurchaseAmount: String(totalPurchaseAmount),
      expectedReturn: String(expectedReturn),
      createdById: 'temp-user-id', // Placeholder for actual user auth
    });

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error) {
    console.error("Failed to create stock:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
