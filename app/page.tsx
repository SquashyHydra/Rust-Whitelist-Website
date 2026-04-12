import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex flex-1 overflow-hidden text-stone-100">
      <div className="absolute inset-0 atmospheric-grid opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#ff8a3d33,transparent_28%),radial-gradient(circle_at_bottom_right,#d14d1f25,transparent_24%)]" />
      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl gap-12 px-6 py-14 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-16 lg:py-20">
        <section className="flex flex-col justify-between">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#ffb27a]">
              Instinctive Rust server
            </div>
            <div className="space-y-6">
              <p className="text-sm font-semibold uppercase tracking-[0.36em] text-[#ff8a3d]">Wasteland whitelist</p>
              <h1 className="max-w-4xl font-display text-6xl uppercase leading-[0.9] text-stone-50 sm:text-7xl lg:text-8xl">
                Entry is earned before boots hit the sand.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-stone-300 sm:text-xl">
                Instinctive's whitelist portal built for manual review, secure approvals, and cleaner server operations. Players send a Steam profile and reason. Admins review the request, then whitelist your steam account on the server.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/request" className="inline-flex items-center justify-center rounded-full bg-[#ff8a3d] px-7 py-4 text-sm font-bold uppercase tracking-[0.22em] text-stone-950 transition hover:bg-[#ffa15f]">
                Request access
              </Link>
              <Link href="/sign-in" className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 py-4 text-sm font-bold uppercase tracking-[0.22em] text-stone-100 transition hover:bg-white/10">
                Admin sign-in
              </Link>
            </div>
          </div>
          <div className="grid gap-4 pt-10 sm:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-black/25 p-5 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">Player intake</p>
              <p className="mt-3 text-sm leading-7 text-stone-200">Notification Email, Steam profile URL and reason-based submissions with server-side validation.</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/25 p-5 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">What we expect</p>
              <p className="mt-3 text-sm leading-7 text-stone-200">Respective and responsible behavior from all players, adherence to server rules, and a positive community spirit.</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/25 p-5 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">Process</p>
              <p className="mt-3 text-sm leading-7 text-stone-200">Admin receive's your request, review it, notify you on the decision, and whiteliste you on the server.</p>
            </div>
          </div>
        </section>
        <section className="flex items-end lg:justify-end">
          <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-black/35 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur sm:p-8">
            <div className="rounded-[28px] border border-[#ff8a3d]/25 bg-[linear-gradient(180deg,rgba(255,138,61,0.12),rgba(255,138,61,0.02))] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ffb27a]">Operational flow</p>
              <ol className="mt-5 space-y-5 text-sm text-stone-200">
                <li>
                  <span className="font-semibold text-stone-50">01.</span> Applicant submits Steam profile and reason.
                </li>
                <li>
                  <span className="font-semibold text-stone-50">02.</span> Creates a request and Emails admins.
                </li>
                <li>
                  <span className="font-semibold text-stone-50">03.</span> Admins open the dedicated request and review the profile.
                </li>
                <li>
                  <span className="font-semibold text-stone-50">04.</span> Approval will whitelist your Steam account on the server.
                </li>
              </ol>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
