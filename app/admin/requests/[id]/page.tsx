import { notFound } from "next/navigation";
import { RequestStatus, SteamResolutionState } from "@prisma/client";

import { AdminDecisionPanel } from "@/components/admin-decision-panel";
import { getPreferredSteamLink, getWhitelistRequestById } from "@/lib/whitelist";

export const dynamic = "force-dynamic";

type RequestDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function statusTone(status: RequestStatus) {
  if (status === RequestStatus.APPROVED) {
    return "bg-emerald-500/15 text-emerald-100 border-emerald-500/25";
  }

  if (status === RequestStatus.REJECTED) {
    return "bg-red-500/15 text-red-100 border-red-500/25";
  }

  return "bg-amber-500/15 text-amber-100 border-amber-500/25";
}

function resolutionTone(state: SteamResolutionState) {
  if (state === SteamResolutionState.RESOLVED) {
    return "bg-emerald-500/15 text-emerald-100 border-emerald-500/25";
  }

  if (state === SteamResolutionState.ERROR) {
    return "bg-red-500/15 text-red-100 border-red-500/25";
  }

  return "bg-amber-500/15 text-amber-100 border-amber-500/25";
}

export default async function RequestDetailPage({ params }: RequestDetailPageProps) {
  const { id } = await params;
  const request = await getWhitelistRequestById(id);

  if (!request) {
    notFound();
  }

  const profileLink = getPreferredSteamLink(request.steamId64, request.steamProfileUrlNormalized);
  const profileLabel =
    request.steamPersonaName ??
    request.steamVanityName ??
    request.steamId64 ??
    "Open Steam profile";
  const canApprove = request.status === RequestStatus.PENDING && Boolean(request.steamId64);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-10 sm:px-10 lg:px-16">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6 rounded-[30px] border border-white/10 bg-black/30 p-6 backdrop-blur">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ff8a3d]">Request detail</p>
              <h1 className="mt-2 font-display text-4xl uppercase text-stone-50">{request.steamPersonaName ?? request.steamId64 ?? request.id}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300">Direct route for internal review, approval, and moderation history.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] ${statusTone(request.status)}`}>
                {request.status}
              </span>
              <span className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] ${resolutionTone(request.steamResolutionState)}`}>
                {request.steamResolutionState}
              </span>
            </div>
          </div>
          <dl className="grid gap-5 md:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Applicant email</dt>
              <dd className="mt-3 text-sm leading-7 text-stone-100">{request.applicantEmail ?? "Not captured on this request."}</dd>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Request IP</dt>
              <dd className="mt-3 text-sm leading-7 text-stone-100">{request.requestIpAddress ?? "Not captured on this request."}</dd>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Request device</dt>
              <dd className="mt-3 text-sm leading-7 text-stone-100">{request.requestDevice ?? "Not captured on this request."}</dd>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Steam profile</dt>
              <dd className="mt-3 text-sm leading-7 text-stone-100">
                <a
                  href={profileLink}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[#ffb27a] transition hover:text-[#ffd5b4]"
                >
                  {profileLabel}
                </a>
                <span className="mt-1 block truncate text-xs text-stone-500" title={profileLink}>
                  {profileLink}
                </span>
              </dd>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Steam ID64</dt>
              <dd className="mt-3 text-sm leading-7 text-stone-100">{request.steamId64 ?? "Not resolved yet"}</dd>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Submitted</dt>
              <dd className="mt-3 text-sm leading-7 text-stone-100">{request.submittedAt.toLocaleString()}</dd>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Admin notification</dt>
              <dd className="mt-3 text-sm leading-7 text-stone-100">{request.emailDeliveryState}</dd>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Applicant notification</dt>
              <dd className="mt-3 text-sm leading-7 text-stone-100">{request.applicantNotificationState}</dd>
            </div>
          </dl>
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Applicant reason</p>
            <p className="mt-4 whitespace-pre-wrap text-base leading-8 text-stone-200">{request.reason}</p>
          </div>
          {request.steamResolutionError ? (
            <div className="rounded-[24px] border border-red-500/30 bg-red-500/10 p-5 text-sm leading-7 text-red-100">
              <p className="font-semibold uppercase tracking-[0.2em]">Resolution error</p>
              <p className="mt-3">{request.steamResolutionError}</p>
            </div>
          ) : null}
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Audit trail</p>
            <div className="mt-4 space-y-4">
              {request.auditLogs.map((entry) => (
                <article key={entry.id} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-100">{entry.action}</p>
                    <p className="text-xs text-stone-400">{entry.createdAt.toLocaleString()}</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-stone-300">{entry.details ?? "No extra details recorded."}</p>
                  {entry.actorEmail ? <p className="mt-2 text-xs uppercase tracking-[0.18em] text-stone-500">Actor: {entry.actorEmail}</p> : null}
                </article>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <AdminDecisionPanel
            requestId={request.id}
            isApproved={request.status === RequestStatus.APPROVED}
            isRejected={request.status === RequestStatus.REJECTED}
            canApprove={canApprove}
          />
          <div className="rounded-[28px] border border-white/10 bg-black/35 p-6 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Review details</p>
            <dl className="mt-4 space-y-4 text-sm text-stone-300">
              <div>
                <dt className="font-semibold text-stone-100">Reviewed by</dt>
                <dd className="mt-1">{request.reviewedByEmail ?? "Awaiting review"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-stone-100">Review note</dt>
                <dd className="mt-1">{request.reviewNote ?? "No note recorded."}</dd>
              </div>
              <div>
                <dt className="font-semibold text-stone-100">Message to applicant</dt>
                <dd className="mt-1 whitespace-pre-wrap">{request.applicantMessage ?? "No applicant message recorded."}</dd>
              </div>
              <div>
                <dt className="font-semibold text-stone-100">Applicant email result</dt>
                <dd className="mt-1 break-all">
                  {request.applicantNotificationError ??
                    (request.applicantNotifiedAt
                      ? `Sent at ${request.applicantNotifiedAt.toLocaleString()}`
                      : "No applicant email result recorded.")}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-stone-100">RCON command</dt>
                <dd className="mt-1 break-all">{request.rconCommand ?? "No command sent."}</dd>
              </div>
              <div>
                <dt className="font-semibold text-stone-100">RCON result</dt>
                <dd className="mt-1 break-all">{request.rconResult ?? "No RCON response recorded."}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </main>
  );
}
