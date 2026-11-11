import { handleGoogleOAuthCallback } from "@/lib/auth/google-oauth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return handleGoogleOAuthCallback(req);
}

