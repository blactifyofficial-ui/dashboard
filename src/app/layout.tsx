import type { Metadata, Viewport } from "next";
import { Inter } from"next/font/google";
import"./globals.css";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
import Breadcrumbs from "@/components/Breadcrumbs";
import SignOutLink from"@/components/SignOutLink";
import { Toaster } from "react-hot-toast";
import { auth } from"@/lib/auth/server";
import { db } from"@/db";
import { allowedUsers } from"@/db/schema";
import { eq } from"drizzle-orm";
import { headers } from "next/headers";

const inter = Inter({
 variable:"--font-inter",
 subsets: ["latin"],
 weight: ["400"],
});

export const metadata: Metadata = {
  title: "Shopify Dashboard",
  description: "Real-time Shopify Sales Dashboard",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Dashboard",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon",
    apple: "/apple-icon",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export const dynamic ='force-dynamic';

 export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = await auth.getSession({
    fetchOptions: { headers: await headers() }
  });
 
 // Check if they are logged in but not allowed
 if (session?.user) {
 const isAllowed = await db.select().from(allowedUsers).where(eq(allowedUsers.email, session.user.email)).limit(1);
 if (isAllowed.length === 0) {
 return (
 <html lang="en"className={`${inter.variable} h-full antialiased dark`}>
 <body className="min-h-full bg-black text-white flex flex-col items-center justify-center font-sans gap-4">
 <div className="text-xl">You are not authorized to view this dashboard.</div>
 <SignOutLink />
 <Toaster position="bottom-right" />
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
 <body className="min-h-full bg-black text-neutral-100 flex flex-col md:flex-row relative selection:bg-white/30 font-sans overflow-x-hidden">
 {/* Sidebar */}
 {session?.user && <ResponsiveSidebar />}

 {/* Main Content */}
 <main className="flex-1 h-full z-10 relative min-w-0">
 <div className="p-4 sm:p-6 md:p-10 max-w-[1920px] mx-auto h-full w-full">
 {session?.user && <Breadcrumbs />}
 {children}
 </div>
 </main>
 <Toaster position="bottom-right" />
 </body>
 </html>
 );
}
