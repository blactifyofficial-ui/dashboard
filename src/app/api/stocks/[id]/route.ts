import { NextResponse } from "next/server";
import { db } from "@/db";
import { stocks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({ 
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const stock = await db.select().from(stocks).where(eq(stocks.id, id)).limit(1);
    if (!stock || stock.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(stock[0]);
  } catch {
    return NextResponse.json({ error: "Failed to load stock" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    // Validation
    if (body.buyingPrice && body.buyingPrice <= 0) {
      return NextResponse.json({ error: "Invalid buying price" }, { status: 400 });
    }
    if (body.sellingPrice && body.sellingPrice <= 0) {
      return NextResponse.json({ error: "Invalid selling price" }, { status: 400 });
    }
    if (body.stockCount && (body.stockCount < 1 || !Number.isInteger(Number(body.stockCount)))) {
      return NextResponse.json({ error: "Invalid stock count" }, { status: 400 });
    }

    const currentStock = await db.select().from(stocks).where(eq(stocks.id, id)).limit(1);
    if (!currentStock || currentStock.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const buyingPrice = body.buyingPrice || currentStock[0].buyingPrice;
    const sellingPrice = body.sellingPrice || currentStock[0].sellingPrice;
    const stockCount = body.stockCount || currentStock[0].stockCount;

    const totalPurchaseAmount = Number(stockCount) * Number(buyingPrice);
    const expectedReturn = Number(stockCount) * Number(sellingPrice);

    await db.update(stocks)
      .set({
        productImage: body.productImage !== undefined ? body.productImage : currentStock[0].productImage,
        buyingPrice: String(buyingPrice),
        stockCount: String(stockCount),
        sellingPrice: String(sellingPrice),
        productId: body.productId !== undefined ? body.productId : currentStock[0].productId,
        totalPurchaseAmount: String(totalPurchaseAmount),
        expectedReturn: String(expectedReturn),
        updatedAt: new Date(),
        updatedById: 'temp-user-id', // Placeholder
      })
      .where(eq(stocks.id, id));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to update stock:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const currentStock = await db.select().from(stocks).where(eq(stocks.id, id)).limit(1);
    if (!currentStock || currentStock.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Attempt to delete from cloudinary if it's a cloudinary URL
    const imageUrl = currentStock[0].productImage;
    if (imageUrl && imageUrl.includes('cloudinary.com')) {
      try {
        // Extract public ID from secure URL
        // Example: https://res.cloudinary.com/demo/image/upload/v12345/stocks/abcde.webp -> stocks/abcde
        const matches = imageUrl.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
        if (matches && matches[1]) {
          await cloudinary.uploader.destroy(matches[1]);
        }
      } catch (cloudErr) {
        console.error("Failed to delete image from Cloudinary, continuing with DB deletion:", cloudErr);
      }
    }

    await db.delete(stocks).where(eq(stocks.id, id));
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete stock:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
