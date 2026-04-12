import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/env";

export async function requireAdminSession() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();

  if (!email || !isAdminEmail(email)) {
    redirect("/sign-in");
  }

  return {
    session,
    email,
  };
}
