"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";

export function MobileHeader() {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-30 pointer-events-none flex items-center justify-center px-4 pt-[max(0.875rem,calc(env(safe-area-inset-top)+0.375rem))] pb-6 bg-gradient-to-b from-background via-background/80 to-transparent">
      <Link
        href="/dashboard"
        className="pointer-events-auto flex items-center justify-center select-none active:scale-95 transition-transform"
        aria-label="Blactify Home"
      >
        <Image
          src="/blactify_logo_font.svg"
          alt="Blactify"
          width={130}
          height={24}
          className="h-5.5 w-auto object-contain hidden dark:block"
          priority
        />
        <Image
          src="/blactify_logo_dark.svg"
          alt="Blactify"
          width={130}
          height={24}
          className="h-5.5 w-auto object-contain block dark:hidden"
          priority
        />
      </Link>
    </header>
  );
}
