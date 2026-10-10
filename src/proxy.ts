import { auth } from "@/lib/auth/server";
import { NextRequest, NextResponse } from "next/server";

const authMiddleware = auth.middleware({ loginUrl: "/login" });

export default async function proxy(request: NextRequest) {
  try {
    return await authMiddleware(request);
  } catch (error) {
    console.error("[proxy] Middleware error, redirecting to login:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}


export const config = {
  matcher: ["/((?!api/auth|api/webhooks|_next/static|_next/image|favicon.ico|login|about|manifest.json|terms|privacy-policy|$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
