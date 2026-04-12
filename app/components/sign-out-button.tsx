"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <form
      action={() => {
        void signOut({ callbackUrl: "/" });
      }}
    >
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-200 transition hover:bg-white/10"
      >
        Sign out
      </button>
    </form>
  );
}
