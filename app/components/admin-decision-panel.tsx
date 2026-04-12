"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type AdminDecisionPanelProps = {
  requestId: string;
  isApproved: boolean;
  isRejected: boolean;
  canApprove: boolean;
};

export function AdminDecisionPanel({
  requestId,
  isApproved,
  isRejected,
  canApprove,
}: AdminDecisionPanelProps) {
  const router = useRouter();
  const [reviewNote, setReviewNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAction(action: "approve" | "reject") {
    startTransition(async () => {
      setMessage("");
      setError("");

      try {
        const response = await fetch(`/api/admin/requests/${requestId}/${action}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reviewNote }),
        });

        const result = (await response.json()) as { error?: string; message?: string };

        if (!response.ok) {
          setError(result.error ?? `Unable to ${action} this request.`);
          return;
        }

        setMessage(result.message ?? `Request ${action}d.`);
        router.refresh();
      } catch {
        setError("A network error prevented the request from being updated.");
      }
    });
  }

  return (
    <div className="space-y-4 rounded-[28px] border border-white/10 bg-black/35 p-6 backdrop-blur">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-400">Admin decision</p>
        <h2 className="mt-2 text-2xl font-semibold text-stone-100">Review outcome</h2>
      </div>
      <textarea
        value={reviewNote}
        onChange={(event) => setReviewNote(event.target.value)}
        rows={5}
        maxLength={500}
        placeholder="Add an internal note for the moderation trail."
        className="w-full rounded-2xl border border-white/10 bg-stone-950/80 px-4 py-3 text-base text-stone-50 outline-none transition focus:border-[#ff8a3d] focus:ring-2 focus:ring-[#ff8a3d]/30"
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => handleAction("approve")}
          disabled={isPending || isApproved || !canApprove}
          className="inline-flex flex-1 items-center justify-center rounded-full bg-[#ff8a3d] px-5 py-3 text-sm font-bold uppercase tracking-[0.2em] text-stone-950 transition hover:bg-[#ffa15f] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Submitting..." : isApproved ? "Already approved" : "Approve and run RCON"}
        </button>
        <button
          type="button"
          onClick={() => handleAction("reject")}
          disabled={isPending || isRejected}
          className="inline-flex flex-1 items-center justify-center rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm font-bold uppercase tracking-[0.2em] text-stone-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Submitting..." : isRejected ? "Already rejected" : "Reject request"}
        </button>
      </div>
      {!canApprove && !isApproved ? (
        <p className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          This request cannot be approved until a valid SteamID64 has been resolved.
        </p>
      ) : null}
      {error ? <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</p> : null}
      {message ? <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{message}</p> : null}
    </div>
  );
}
