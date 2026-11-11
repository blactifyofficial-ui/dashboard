import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.getSession();
  return NextResponse.json(session);
}

