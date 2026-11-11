import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/token";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

export async function GET(req: Request) {
  const response = NextResponse.redirect(new URL("/login", req.url));
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

