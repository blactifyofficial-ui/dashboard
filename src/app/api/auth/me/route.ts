import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.getSession();
  if (!session?.data?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ user: session.data.user });
}

export async function HEAD() {
  const session = await auth.getSession();
  if (!session?.data?.user) {
    return new Response(null, { status: 401 });
  }
  return new Response(null, { status: 200 });
}

