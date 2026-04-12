"use client";

import { useState, useTransition } from "react";

const minimumReasonLength = 60;

const initialState = {
  error: "",
  success: "",
  requestId: "",
};

export function RequestForm() {
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const payload = {
      applicantEmail: String(formData.get("applicantEmail") ?? "").trim(),
      steamProfileUrl: String(formData.get("steamProfileUrl") ?? ""),
      reason: String(formData.get("reason") ?? ""),
    };

    startTransition(async () => {
      setState(initialState);

      try {
        const response = await fetch("/api/whitelist-requests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const result = (await response.json()) as {
          error?: string;
          requestId?: string;
          message?: string;
        };

        if (!response.ok) {
          setState({
            error: result.error ?? "Your request could not be submitted.",
            success: "",
            requestId: "",
          });
          return;
        }

        setState({
          error: "",
          success: result.message ?? "Request submitted.",
          requestId: result.requestId ?? "",
        });
      } catch {
        setState({
          error: "A network error prevented the request from being submitted.",
          success: "",
          requestId: "",
        });
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5 rounded-[28px] border border-white/10 bg-black/35 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.4)] backdrop-blur">
      <div className="space-y-2">
        <label className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-300" htmlFor="applicantEmail">
          Email address
        </label>
        <input
          id="applicantEmail"
          name="applicantEmail"
          type="email"
          placeholder="you@example.com"
          required
          className="w-full rounded-2xl border border-white/10 bg-stone-950/80 px-4 py-3 text-base text-stone-50 outline-none transition focus:border-[#ff8a3d] focus:ring-2 focus:ring-[#ff8a3d]/30"
        />
        <p className="text-sm leading-6 text-stone-400">This is where the admin decision will be sent.</p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-300" htmlFor="steamProfileUrl">
          Steam profile URL
        </label>
        <input
          id="steamProfileUrl"
          name="steamProfileUrl"
          type="url"
          placeholder="https://steamcommunity.com/id/yourname"
          required
          className="w-full rounded-2xl border border-white/10 bg-stone-950/80 px-4 py-3 text-base text-stone-50 outline-none transition focus:border-[#ff8a3d] focus:ring-2 focus:ring-[#ff8a3d]/30"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-300" htmlFor="reason">
          Why do you want to join?
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={7}
          required
          minLength={minimumReasonLength}
          maxLength={1200}
          placeholder="Tell the admins what kind of player you are, what you want from the server, and why you would be a good fit."
          className="w-full rounded-2xl border border-white/10 bg-stone-950/80 px-4 py-3 text-base text-stone-50 outline-none transition focus:border-[#ff8a3d] focus:ring-2 focus:ring-[#ff8a3d]/30"
        />
        <p className="text-sm leading-6 text-stone-400">
          Use at least 60 characters and 10 words. Brief or repetitive answers are rejected.
        </p>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-full bg-[#ff8a3d] px-5 py-3 text-sm font-bold uppercase tracking-[0.22em] text-stone-950 transition hover:bg-[#ffa15f] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Transmitting request..." : "Submit whitelist request"}
      </button>
      {state.error ? <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{state.error}</p> : null}
      {state.success ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          <p>{state.success}</p>
          {state.requestId ? <p className="mt-1 text-emerald-200/80">Reference: {state.requestId}</p> : null}
        </div>
      ) : null}
    </form>
  );
}
