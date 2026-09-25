import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { LayoutDashboard, ClipboardList, ShoppingBag, CalendarDays } from "lucide-react";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Shopify Dashboard",
  description: "Real-time Shopify Sales Dashboard",
};

import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { allowedUsers } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = await auth.getSession();
  
  // Check if they are logged in but not allowed
  if (session?.user) {
    const isAllowed = await db.select().from(allowedUsers).where(eq(allowedUsers.email, session.user.email)).limit(1);
    if (isAllowed.length === 0) {
      return (
        <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
          <body className="min-h-full bg-black text-white flex flex-col items-center justify-center font-sans gap-4">
            <div className="text-xl">You are not authorized to view this dashboard.</div>
            <Link href="/api/auth/signout" className="text-blue-500 hover:underline">Sign Out</Link>
          </body>
        </html>
      );
    }
  }

  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-black text-neutral-100 flex relative selection:bg-white/30 font-sans">
        {/* Sidebar */}
        {session?.user && (
          <aside className="w-64 shrink-0 border-r border-white/10 bg-white/[0.02] backdrop-blur-xl h-screen sticky top-0 flex flex-col z-50">
            <div className="p-8 border-b border-white/5">
              <h1 className="text-2xl font-normal tracking-tight text-white uppercase">
                BLACTIFY
              </h1>
            </div>
            <nav className="flex-1 p-4 space-y-2 mt-4">
              <Link href="/" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white/80 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-200">
                <LayoutDashboard size={20} className="text-white/60" /> Overview
              </Link>
              <Link href="/orders" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white/80 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-200">
                <ClipboardList size={20} className="text-white/60" /> Orders
              </Link>
              <Link href="/product-revenue" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white/80 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-200">
                <ShoppingBag size={20} className="text-white/60" /> Products
              </Link>
              <Link href="/revenue" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white/80 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-200">
                <CalendarDays size={20} className="text-white/60" /> Monthly
              </Link>
            </nav>
            <div className="p-6 border-t border-white/5 text-xs text-neutral-500 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span> Systems Online
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 h-full z-10 relative">
          <div className="p-10 max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
