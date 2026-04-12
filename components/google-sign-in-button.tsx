"use client";

import { signIn } from "next-auth/react";

export function GoogleSignInButton() {
  return (
    <button
      type="button"
      onClick={() => {
        void signIn("google", { callbackUrl: "/admin" });
      }}
      className="inline-flex items-center justify-center rounded-full bg-[#ff8a3d] px-6 py-3 text-sm font-bold uppercase tracking-[0.24em] text-stone-950 transition hover:bg-[#ffa15f]"
    >
      Continue with Google
    </button>
  );
}
