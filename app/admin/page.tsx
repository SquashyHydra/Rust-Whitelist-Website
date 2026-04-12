import Link from "next/link";
import { RequestStatus } from "@prisma/client";

import { getAdminDashboardData, getPreferredSteamLink } from "@/lib/whitelist";

export const dynamic = "force-dynamic";

function statusCopy(status: RequestStatus) {
  return status === RequestStatus.PENDING
    ? "Pending"
    : status === RequestStatus.APPROVED
      ? "Approved"
      : "Rejected";
}

export default async function AdminPage() {
  const { pendingRequests, processedRequests } = await getAdminDashboardData();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-6 py-10 sm:px-10 lg:px-16">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">Pending</p>
          <p className="mt-3 font-display text-5xl uppercase text-stone-50">{pendingRequests.length}</p>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">Processed</p>
          <p className="mt-3 font-display text-5xl uppercase text-stone-50">{processedRequests.length}</p>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">Review route</p>
          <p className="mt-3 max-w-xs text-sm leading-7 text-stone-300">Every request gets its own admin URL so moderators can share a direct review link internally.</p>
        </div>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-[30px] border border-white/10 bg-black/30 p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ff8a3d]">Queue</p>
              <h1 className="mt-2 font-display text-4xl uppercase text-stone-50">Pending requests</h1>
            </div>
          </div>
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <p className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-stone-300">No pending requests yet.</p>
            ) : (
              pendingRequests.map((request) => (
                <article key={request.id} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">{statusCopy(request.status)}</p>
                      <h2 className="mt-2 text-xl font-semibold text-stone-50">{request.steamPersonaName ?? request.steamId64 ?? "Steam profile pending resolution"}</h2>
                    </div>
                    <Link href={`/admin/requests/${request.id}`} className="rounded-full bg-[#ff8a3d] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-950 transition hover:bg-[#ffa15f]">
                      Open request
                    </Link>
                  </div>
                  <p className="mt-4 line-clamp-3 text-sm leading-7 text-stone-300">{request.reason}</p>
                  <p className="mt-4 text-xs uppercase tracking-[0.18em] text-stone-500">
                    {request.requestIpAddress ?? "IP unavailable"} · {request.requestDevice ?? "Device unavailable"}
                  </p>
                  <a href={getPreferredSteamLink(request.steamId64, request.steamProfileUrlNormalized)} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-semibold text-[#ffb27a] transition hover:text-[#ffd5b4]">
                    View Steam profile
                  </a>
                </article>
              ))
            )}
          </div>
        </div>
        <div className="space-y-4 rounded-[30px] border border-white/10 bg-black/30 p-6 backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">Archive</p>
            <h2 className="mt-2 font-display text-4xl uppercase text-stone-50">Recent decisions</h2>
          </div>
          <div className="space-y-4">
            {processedRequests.length === 0 ? (
              <p className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-stone-300">No processed requests yet.</p>
            ) : (
              processedRequests.map((request) => (
                <article key={request.id} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">{statusCopy(request.status)}</p>
                      <h3 className="mt-2 text-lg font-semibold text-stone-50">{request.steamPersonaName ?? request.steamId64 ?? request.id}</h3>
                    </div>
                    <Link href={`/admin/requests/${request.id}`} className="text-sm font-semibold text-stone-200 transition hover:text-white">
                      Review log
                    </Link>
                  </div>
                  <p className="mt-4 text-sm text-stone-400">Handled by {request.reviewedByEmail ?? "Unknown admin"}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                    {request.requestIpAddress ?? "IP unavailable"} · {request.requestDevice ?? "Device unavailable"}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
