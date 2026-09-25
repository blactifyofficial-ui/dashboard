import { auth } from "@/lib/auth/server";

export default auth.middleware({ loginUrl: "/login" });

export const config = {
  matcher: ["/((?!api/auth|api/webhooks|_next/static|_next/image|favicon.ico|login|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
