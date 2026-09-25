import type { Metadata, Viewport } from "next";
import { Inter } from"next/font/google";
import"./globals.css";
import Link from"next/link";
import Image from"next/image";
import SidebarNav from"@/components/SidebarNav";
import LogoutButton from"@/components/LogoutButton";
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
 title:"Shopify Dashboard",
 description:"Real-time Shopify Sales Dashboard",
 manifest: "/manifest.json",
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
 <body className="min-h-full bg-black text-neutral-100 flex flex-col md:flex-row relative selection:bg-white/30 font-sans">
 {/* Sidebar */}
 {session?.user && (
 <aside className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-white/10 bg-white/[0.02] backdrop-blur-xl md:h-screen md:sticky top-0 flex flex-col z-50">
 <div className="p-4 md:p-8 border-b border-white/5 hidden md:block">
 <Link href="/">
 <Image src="/blactify_logo_font.svg"alt="Blactify"width={150} height={32} className="h-8 object-contain"style={{ width:'auto', height: 'auto'}} priority />
 </Link>
 </div>
 <nav className="flex md:flex-col md:flex-1 md: p-2 md:p-4 gap-2 md:gap-0 md:space-y-2 mt-0 md:mt-4 no-scrollbar items-center md:items-stretch">
 <SidebarNav />
 
 <div className="md:mt-auto pt-4 border-t border-white/5 md:w-full mt-0 border-none md:border-solid md:border-t flex items-center md:block">
 <LogoutButton />
 </div>
 </nav>

 </aside>
 )}

 {/* Main Content */}
 <main className="flex-1 h-full z-10 relative min-w-0">
 <div className="p-4 sm:p-6 md:p-10 max-w-[1920px] mx-auto h-full w-full">
 {children}
 </div>
 </main>
 <Toaster position="bottom-right" />
 </body>
 </html>
 );
}
