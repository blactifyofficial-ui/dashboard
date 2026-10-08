import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ResponsiveSidebar from "@/components/ResponsiveSidebar";
import SignOutLink from "@/components/SignOutLink";
import { Toaster } from "react-hot-toast";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { allowedUsers, customRoles, UserRole, userRoles } from "@/db/schema";
import { ilike, eq } from "drizzle-orm";
import AutoSyncManager from "@/components/AutoSyncManager";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = await auth.getSession();

  let userRole: UserRole = 'VIEWER';
  let partnerId: string | null = null;
  let userPermissions: string[] = [];

  // Check if they are logged in but not allowed
  if (session?.user?.email) {
    const [allowed] = await db
      .select()
      .from(allowedUsers)
      .where(ilike(allowedUsers.email, session.user.email))
      .limit(1);

    if (!allowed) {
      return (
        <html lang="en" suppressHydrationWarning className={`${inter.variable} h-full antialiased`}>
          <body className="min-h-full bg-background text-foreground flex flex-col items-center justify-center font-sans gap-4">
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <div className="text-xl font-medium">You are not authorized to view this dashboard.</div>
              <SignOutLink />
              <Toaster position="bottom-right" />
            </ThemeProvider>
          </body>
        </html>
      );
    }

    userRole = allowed.role;
    partnerId = allowed.partnerId;

    if (!userRoles.includes(userRole as typeof userRoles[number])) {
      const [customRoleRecord] = await db
        .select()
        .from(customRoles)
        .where(eq(customRoles.code, userRole))
        .limit(1);

      if (customRoleRecord?.permissions) {
        try {
          userPermissions = JSON.parse(customRoleRecord.permissions);
        } catch (err) {
          console.error("Failed to parse custom role permissions JSON in layout:", err);
        }
      }
    }
  }

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="h-[100dvh] overflow-hidden bg-background text-foreground flex flex-col md:flex-row relative selection:bg-foreground/20 font-sans transition-colors duration-150">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider
            initialUser={session?.user || null}
            initialRole={userRole}
            initialPartnerId={partnerId}
            initialPermissions={userPermissions}
          >
            {/* Sidebar */}
            {session?.user && (
              <>
                <ResponsiveSidebar />
                <AutoSyncManager />
              </>
            )}

            {/* Main Content */}
            {session?.user ? (
              <main className="flex-1 w-full min-w-0 px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 lg:pt-8 pb-[max(1rem,env(safe-area-inset-bottom))] z-10 relative h-full flex flex-col overflow-y-auto">
                <div className="mx-auto w-full max-w-7xl h-full flex flex-col min-h-0">
                  <div className="flex-1 min-h-0 pb-2 sm:pb-6 lg:pb-8 flex flex-col">
                    {children}
                  </div>
                </div>
              </main>
            ) : (
              <main className="flex-1 w-full h-full bg-background pb-[env(safe-area-inset-bottom)]">
                {children}
              </main>
            )}
            <Toaster position="bottom-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
