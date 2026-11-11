import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  SessionUser,
  verifySessionToken,
} from "./token";

export interface SessionData {
  user: SessionUser;
}

export const auth = {
  /**
   * Retrieves the current authenticated user session in Server Components and Route Handlers.
   */
  async getSession(): Promise<{ data: SessionData | null }> {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
      if (!token) {
        return { data: null };
      }

      const user = await verifySessionToken(token);
      if (!user) {
        return { data: null };
      }

      return { data: { user } };
    } catch (err) {
      console.error("[auth] Error reading session:", err);
      return { data: null };
    }
  },

  /**
   * Next.js middleware / proxy helper.
   */
  middleware({ loginUrl = "/login" }: { loginUrl?: string } = {}) {
    return async (request: NextRequest) => {
      const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
      if (token) {
        const user = await verifySessionToken(token);
        if (user) {
          return NextResponse.next();
        }
      }

      const redirectUrl = new URL(loginUrl, request.url);
      return NextResponse.redirect(redirectUrl);
    };
  },

  /**
   * Catch-all handler for /api/auth/[...path]
   */
  handler() {
    return {
      GET: async (req: Request) => {
        const url = new URL(req.url);
        if (url.pathname.endsWith("/me") || url.pathname.endsWith("/session")) {
          const cookieStore = await cookies();
          const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
          if (token) {
            const user = await verifySessionToken(token);
            if (user) {
              return NextResponse.json({ user, session: { user } });
            }
          }
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json({ error: "Not Found" }, { status: 404 });
      },
      POST: async (req: Request) => {
        const url = new URL(req.url);
        if (url.pathname.endsWith("/signout") || url.pathname.endsWith("/sign-out")) {
          const cookieStore = await cookies();
          cookieStore.delete(SESSION_COOKIE_NAME);
          return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: "Not Found" }, { status: 404 });
      },
      PUT: async () => NextResponse.json({ error: "Method Not Allowed" }, { status: 405 }),
      DELETE: async () => NextResponse.json({ error: "Method Not Allowed" }, { status: 405 }),
      PATCH: async () => NextResponse.json({ error: "Method Not Allowed" }, { status: 405 }),
    };
  },
};
