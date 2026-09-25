import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import ClientLogin from "./ClientLogin";

export default async function LoginPage() {
  const { data: session } = await auth.getSession();
  
  if (session?.user) {
    redirect("/");
  }

  return <ClientLogin />;
}
