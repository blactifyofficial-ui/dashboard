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
  const { data: session } = await auth.getSession();
 
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
      <body className="h-[100dvh] overflow-hidden bg-black text-neutral-100 flex flex-col md:flex-row relative selection:bg-white/30 font-sans">
        {/* Sidebar */}
        {session?.user && <ResponsiveSidebar />}

        {/* Main Content */}
        <main className="flex-1 w-full min-w-0 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-0 z-10 relative h-full flex flex-col overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl h-full flex flex-col min-h-0">
            <div className="flex-none">
              {session?.user && <Breadcrumbs />}
            </div>
            <div className="flex-1 min-h-0 pb-4 sm:pb-6 lg:pb-8 flex flex-col">
              {children}
            </div>
          </div>
        </main>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
