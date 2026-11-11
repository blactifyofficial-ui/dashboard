"use client";

import { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import { AlertCircle } from "lucide-react";

export default function ClientLogin() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  const errorParam = searchParams.get("error");
  const emailParam = searchParams.get("email");

  let errorMessage: string | null = null;
  if (errorParam === "not_allowed") {
    errorMessage = emailParam
      ? `Access Denied: ${emailParam} is not authorized to access this dashboard. Please contact an administrator.`
      : "Access Denied: Your Google account is not in the allowed users list. Please contact an administrator.";
  } else if (errorParam === "access_denied") {
    errorMessage = "Sign-in was cancelled or access was denied.";
  } else if (errorParam === "state_mismatch") {
    errorMessage = "Authentication session expired. Please try signing in again.";
  } else if (errorParam) {
    errorMessage = `Authentication failed (${errorParam}). Please try again.`;
  }

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center bg-background relative text-foreground">
      <div className="absolute top-6 right-6 z-20">
        <ThemeSwitcher />
      </div>

      <div className="z-10 flex flex-col items-center max-w-sm w-full px-6">
        <div className="mb-3 flex items-center justify-center">
          <Image
            src="/blactify_logo_font.svg"
            alt="Blactify"
            width={237}
            height={24}
            className="h-7 w-auto object-contain hidden dark:block"
            style={{ width: "auto" }}
            priority
          />
          <Image
            src="/blactify_logo_dark.svg"
            alt="Blactify"
            width={237}
            height={24}
            className="h-7 w-auto object-contain block dark:hidden"
            style={{ width: "auto" }}
            priority
          />
        </div>
        <p className="text-[14px] text-muted-foreground mb-6 text-center tracking-[-0.224px]">
          Admin Dashboard Access
        </p>

        {errorMessage && (
          <div className="w-full mb-6 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs leading-relaxed flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full h-[44px] bg-[#0066cc] hover:bg-[#0071e3] text-white flex items-center justify-center gap-3 px-6 rounded-full text-[15px] sm:text-[17px] font-normal tracking-[-0.374px] outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-[#0071e3] focus-visible:outline-offset-2 cursor-pointer shadow-sm hover:shadow"
        >
          {loading ? (
            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
              <path
                d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.25024 6.60998L5.27028 9.73498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                fill="#EA4335"
              />
              <path
                d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L20.18 21.28C22.57 19.09 24 15.96 24 12.275H23.49Z"
                fill="#4285F4"
              />
              <path
                d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.23999 6.57983C0.43993 8.17983 0 9.99983 0 11.9998C0 13.9998 0.43993 15.8198 1.24 17.4198L5.26498 14.2949Z"
                fill="#FBBC05"
              />
              <path
                d="M12.0004 24C15.2404 24 17.9654 22.935 20.0604 21.095L16.0754 17.905C14.9554 18.655 13.5604 19.1 12.0004 19.1C8.8754 19.1 6.22038 16.995 5.2754 14.125L1.25037 17.25C3.25538 21.17 7.3104 24 12.0004 24Z"
                fill="#34A853"
              />
            </svg>
          )}
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
