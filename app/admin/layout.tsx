import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";
import { requireAdminSession } from "@/lib/auth-helpers";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { email } = await requireAdminSession();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ff8a3d22,transparent_22%),linear-gradient(180deg,#0f0c09_0%,#18120d_48%,#0a0908_100%)] text-stone-100">
      <header className="border-b border-white/10 bg-black/25 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-16">
          <div>
            <Link href="/admin" className="font-display text-3xl uppercase tracking-[0.12em] text-stone-50">
              Wasteland Control
            </Link>
            <p className="text-sm text-stone-400">Signed in as {email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-200 transition hover:bg-white/10">
              Dashboard
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
