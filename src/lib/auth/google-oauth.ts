import { NextResponse } from "next/server";
import { db } from "@/db";
import { allowedUsers, users } from "@/db/schema";
import { ilike, eq } from "drizzle-orm";
import {
  DEFAULT_MAX_AGE_SECONDS,
  OAUTH_STATE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  SessionUser,
  signSessionToken,
} from "./token";

export function getRedirectUri(req: Request): string {
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }
  const url = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  return `${proto}://${host}/api/auth/callback/google`;
}

interface GoogleUserInfo {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email: string;
  email_verified?: boolean;
}

export async function handleGoogleOAuthCallback(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    console.error("[auth] Google OAuth returned error:", error);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", req.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("[auth] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
    return NextResponse.redirect(new URL("/login?error=oauth_config_missing", req.url));
  }

  // Parse state cookie
  const cookieHeader = req.headers.get("cookie") || "";
  const cookiesMap = new Map<string, string>();
  cookieHeader.split(";").forEach((c) => {
    const [k, ...v] = c.trim().split("=");
    if (k) cookiesMap.set(k, decodeURIComponent(v.join("=")));
  });

  const stateCookieRaw = cookiesMap.get(OAUTH_STATE_COOKIE_NAME);
  let savedState: string | undefined;
  let callbackURL = "/dashboard";
  let redirectUri = getRedirectUri(req);

  if (stateCookieRaw) {
    try {
      const parsed = JSON.parse(stateCookieRaw);
      savedState = parsed.state;
      if (parsed.callbackURL) callbackURL = parsed.callbackURL;
      if (parsed.redirectUri) redirectUri = parsed.redirectUri;
    } catch {
      // Fallback if parsing fails
    }
  }

  if (savedState && state && savedState !== state) {
    console.warn("[auth] OAuth state mismatch. Possible CSRF attempt.");
    return NextResponse.redirect(new URL("/login?error=state_mismatch", req.url));
  }

  // Exchange authorization code for Google access token
  let tokenData: { access_token?: string; id_token?: string; error?: string };
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[auth] Failed to exchange code for token:", tokenData);
      return NextResponse.redirect(new URL("/login?error=token_exchange_failed", req.url));
    }
  } catch (err) {
    console.error("[auth] Error communicating with Google token endpoint:", err);
    return NextResponse.redirect(new URL("/login?error=token_exchange_error", req.url));
  }

  // Retrieve user profile from Google
  let profile: GoogleUserInfo;
  try {
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      console.error("[auth] Failed to fetch Google userinfo:", await userRes.text());
      return NextResponse.redirect(new URL("/login?error=fetch_user_failed", req.url));
    }

    profile = await userRes.json();
  } catch (err) {
    console.error("[auth] Error fetching Google userinfo:", err);
    return NextResponse.redirect(new URL("/login?error=userinfo_error", req.url));
  }

  const cleanEmail = profile.email?.trim().toLowerCase();
  if (!cleanEmail) {
    return NextResponse.redirect(new URL("/login?error=missing_email", req.url));
  }

  // Check if user is in allowed_users table
  const [allowed] = await db
    .select()
    .from(allowedUsers)
    .where(ilike(allowedUsers.email, cleanEmail))
    .limit(1);

  if (!allowed) {
    console.warn(`[auth] Access Denied: ${cleanEmail} is not in allowed_users`);
    const deniedUrl = new URL("/login", req.url);
    deniedUrl.searchParams.set("error", "not_allowed");
    deniedUrl.searchParams.set("email", cleanEmail);
    const res = NextResponse.redirect(deniedUrl);
    res.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    return res;
  }

  // Ensure user exists in "user" table (for foreign key constraints across the system)
  let userId: string;
  try {
    const [existingUser] = await db
      .select()
      .from(users)
      .where(ilike(users.email, cleanEmail))
      .limit(1);

    if (existingUser) {
      userId = existingUser.id;
      if (profile.name && profile.name !== existingUser.name) {
        await db
          .update(users)
          .set({ name: profile.name })
          .where(eq(users.id, existingUser.id));
      }
    } else {
      userId = crypto.randomUUID();
      await db.insert(users).values({
        id: userId,
        email: cleanEmail,
        name: profile.name || cleanEmail.split("@")[0],
      });
    }
  } catch (dbErr) {
    console.error("[auth] Failed to synchronize user record:", dbErr);
    userId = crypto.randomUUID();
  }

  // Create signed session token
  const sessionUser: SessionUser = {
    id: userId,
    email: cleanEmail,
    name: profile.name || cleanEmail.split("@")[0],
    image: profile.picture || null,
  };

  const sessionToken = await signSessionToken(sessionUser);

  const destinationPath =
    callbackURL && callbackURL.startsWith("/") && !callbackURL.startsWith("//")
      ? callbackURL
      : "/dashboard";

  const targetUrl = new URL(destinationPath, req.url);
  const response = NextResponse.redirect(targetUrl);

  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DEFAULT_MAX_AGE_SECONDS,
  });

  response.cookies.delete(OAUTH_STATE_COOKIE_NAME);

  return response;
}
