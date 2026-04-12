import { RequestForm } from "@/components/request-form";

export default function RequestPage() {
  return (
    <main className="relative overflow-hidden px-6 py-20 text-stone-100 sm:px-10 lg:px-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#ff8a3d22,transparent_38%),radial-gradient(circle_at_bottom_right,#d14d1f22,transparent_28%)]" />
      <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#ff8a3d]">Rust whitelist intake</p>
          <h1 className="max-w-2xl font-display text-5xl uppercase leading-none text-stone-50 sm:text-6xl">
            Submit your access request.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-stone-300">
            Send your email address, Steam community profile, and a real reason for wanting to play here. The admin team reviews every request manually before access is granted.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">What to send</p>
              <p className="mt-3 text-sm leading-7 text-stone-200">A valid email address, a valid Steam profile URL, and a reason that gives the admins enough context to trust the request.</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">What happens next</p>
              <p className="mt-3 text-sm leading-7 text-stone-200">Admins are notified of the submission by email, where approval will whitelist your Steam account on the server. You will receive the final decision by email.</p>
            </div>
          </div>
        </section>
        <RequestForm />
      </div>
    </main>
  );
}
