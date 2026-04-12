import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/auth";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { isAdminEmail } from "@/lib/env";

type SignInPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const errorCopy: Record<string, string> = {
  AccessDenied: "Your Google account is not on the admin allowlist.",
  Configuration: "Google OAuth is not configured yet.",
  OAuthSignin: "Google sign-in could not be started. Check your Google client ID, secret, and callback URL.",
  OAuthCallback: "Google sign-in returned an invalid callback. Check the authorized redirect URI in Google Cloud.",
  OAuthCreateAccount: "The Google account could not be linked for sign-in.",
  Callback: "The authentication callback failed. Check your auth configuration and try again.",
  Default: "Authentication failed. Check your environment configuration and try again.",
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();

  if (email && isAdminEmail(email)) {
    redirect("/admin");
  }

  const params = await searchParams;
  const error = params.error ? (errorCopy[params.error] ?? "Sign-in failed.") : "";

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-20 text-stone-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#ff8a3d30,transparent_30%),radial-gradient(circle_at_bottom,#d14d1f24,transparent_26%)]" />
      <div className="relative w-full max-w-xl rounded-4xl border border-white/10 bg-black/40 p-8 shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#ff8a3d]">Admin access</p>
        <h1 className="mt-4 font-display text-5xl uppercase leading-none text-stone-50">Secure whitelist control.</h1>
        <p className="mt-5 text-base leading-8 text-stone-300">
          The admin panel is protected by Google OAuth and an explicit email allowlist. If you are not already registered as an admin, access will be denied.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <GoogleSignInButton />
          <Link href="/" className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-300 transition hover:text-white">
            Back to landing page
          </Link>
        </div>
        {error ? <p className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</p> : null}
      </div>
    </main>
  );
}
