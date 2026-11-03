"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashScreen() {
  const [status, setStatus] = useState<"visible" | "fading" | "hidden">("visible");

  useEffect(() => {
    // Check if already displayed in this tab session
    let alreadySeen = false;
    try {
      alreadySeen = sessionStorage.getItem("blactify_splash_seen") === "true";
    } catch {
      // Ignore in private browsing or restricted storage environments
    }

    // Keep splash visible briefly for smooth transition, then fade out
    const dwellTime = alreadySeen ? 250 : 750;

    const fadeTimer = setTimeout(() => {
      setStatus("fading");
      try {
        sessionStorage.setItem("blactify_splash_seen", "true");
      } catch {
        // Ignore
      }
    }, dwellTime);

    // Fully unmount after fade transition completes
    const destroyTimer = setTimeout(() => {
      setStatus("hidden");
    }, dwellTime + 450);

    // Hard fallback safety timer to guarantee UI is never blocked
    const safetyTimer = setTimeout(() => {
      setStatus("hidden");
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(destroyTimer);
      clearTimeout(safetyTimer);
    };
  }, []);

  if (status === "hidden") {
    return null;
  }

  const isFading = status === "fading";

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label="Loading Blactify"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-background text-foreground transition-all duration-400 ease-out select-none ${isFading
          ? "opacity-0 scale-[1.02] pointer-events-none"
          : "opacity-100 scale-100 pointer-events-auto"
        }`}
    >
      {/* Ambient decorative glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none transition-opacity duration-500"
      />

        <div className="relative z-10 flex flex-col items-center animate-splash-in">
          {/* Blactify logo with blactify_logo_dark.svg */}
          <div className="relative flex items-center justify-center">
            <Image
              src="/blactify_logo_dark.svg"
              alt="Blactify"
              width={653}
              height={66}
              priority
              className="w-28 sm:w-36 h-auto object-contain splash-logo-invert transition-transform duration-500 ease-out"
              style={{ width: "auto", maxHeight: "22px" }}
            />
          </div>
        </div>

        <span className="sr-only">Loading Blactify Dashboard...</span>
    </aside>
  );
}

