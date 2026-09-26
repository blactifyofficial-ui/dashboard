import { auth } from "@/lib/auth/server";

export default auth.middleware({ loginUrl: "/login" });

export const config = {
  matcher: ["/((?!api/auth|api/webhooks|_next/static|_next/image|favicon.ico|login|about|manifest.json|terms|privacy-policy|$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
