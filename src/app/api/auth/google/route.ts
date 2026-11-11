import { NextResponse } from "next/server";
import { OAUTH_STATE_COOKIE_NAME } from "@/lib/auth/token";
import { getRedirectUri } from "@/lib/auth/google-oauth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID is not configured in environment variables." },
      { status: 500 }
    );
  }

  const url = new URL(req.url);
  const callbackURL = url.searchParams.get("callbackURL") || "/dashboard";
  const redirectUri = getRedirectUri(req);
  const state = crypto.randomUUID();

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("state", state);
  googleAuthUrl.searchParams.set("prompt", "select_account");

  const statePayload = JSON.stringify({ state, callbackURL, redirectUri });

  const response = NextResponse.redirect(googleAuthUrl.toString());
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, statePayload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  return response;
}
