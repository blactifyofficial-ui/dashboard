import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import ClientLogin from "./ClientLogin";

export default async function LoginPage() {
  try {
    const { data: session } = await auth.getSession();

    if (session?.user) {
      redirect("/dashboard");
    }
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      ((error as { digest: string }).digest.startsWith("NEXT_REDIRECT") ||
        (error as { digest: string }).digest.startsWith("NEXT_ROUTER_REDIRECT"))
    ) {
      throw error;
    }
    console.warn("LoginPage session check fallback:", error);
  }

  return (
    <Suspense fallback={<div className="flex h-full w-full items-center justify-center bg-background" />}>
      <ClientLogin />
    </Suspense>
  );
}
