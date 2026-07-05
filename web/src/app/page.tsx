import Link from "next/link";
import { AppDownloadBadges } from "@/components/AppDownloadBadges";
import { WaitlistForm } from "@/components/WaitlistForm";
import { VisitorTracker } from "@/components/VisitorTracker";

const features = [
  {
    icon: "🔓",
    title: "Prayer Unlock — your situation in, guidance out",
    description:
      "Type what you're facing — anxiety, job loss, relationships, grief. Get Bible verses chosen for your situation and the type of prayer that can help you through it.",
  },
  {
    icon: "📖",
    title: "Scripture with AI explanation",
    description:
      "Every verse comes with context — why it speaks to your situation and how to apply it. Go deeper with the AI Bible coach when you need more.",
  },
  {
    icon: "🙏",
    title: "Guided prayer, not generic content",
    description:
      "Learn which prayer to pray — surrender, lament, intercession, warfare — with step-by-step guidance and a prayer you can speak aloud right now.",
  },
  {
    icon: "🔥",
    title: "Stay consistent with God",
    description:
      "Daily habits, streaks, accountability partners, and church groups — so prayer isn't just a one-time fix but a rhythm that carries you through.",
  },
];

const steps = [
  { step: "1", title: "Describe your situation", body: "Job anxiety, broken relationship, fear about the future — say it plainly." },
  { step: "2", title: "Get Scripture + prayer type", body: "2–3 Bible verses matched to you, plus the prayer style that fits." },
  { step: "3", title: "Pray your way through", body: "Follow the steps, pray the sample prayer, and build daily consistency." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <VisitorTracker />
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#ccff00] to-[#a855f7] font-bold text-black">
            PU
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold">PrayerUnlocks</p>
            <p className="hidden text-xs text-muted sm:block">Scripture & prayer for every situation</p>
          </div>
        </div>
        <nav className="flex w-full items-center justify-end gap-3 sm:w-auto sm:gap-4">
          <Link href="/sign-in" className="text-sm font-medium text-muted hover:text-ink">
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-xl bg-[#ccff00] px-4 py-2.5 text-sm font-semibold text-black hover:opacity-90"
          >
            Start free
          </Link>
        </nav>
      </header>

      <section className="relative overflow-hidden px-4 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_12%,rgba(204,255,0,0.15),transparent_28%),radial-gradient(circle_at_10%_80%,rgba(168,85,247,0.12),transparent_35%)]" />
        <div className="relative mx-auto max-w-6xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#a855f7]">
            Pray your way out of any situation
          </p>
          <h1 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            Whatever you&apos;re facing — there&apos;s a verse and a prayer for it.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-muted sm:text-lg">
            PrayerUnlocks listens to your situation and recommends{" "}
            <strong className="font-semibold text-ink">Bible verses to read</strong>, the{" "}
            <strong className="font-semibold text-ink">type of prayer</strong> that fits, and
            AI explanations so you actually understand Scripture — not just read it.
          </p>
          <div className="mt-10">
            <WaitlistForm />
          </div>
          <div className="mt-8">
            <p className="mb-3 text-sm font-medium text-muted">Get the mobile app</p>
            <AppDownloadBadges />
          </div>
          <p className="mt-4 text-sm text-muted">
            Free prayer unlocks · Premium AI coach · Built for real life, not just Sunday
          </p>
        </div>
      </section>

      <section className="border-y border-line bg-white/60 px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[#a855f7]">
              Mobile app
            </p>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">
              Prayer Unlock in your pocket
            </h2>
            <p className="mt-2 max-w-md text-muted">
              Type your situation on the go — get Scripture, prayer guidance, and daily habits
              on iPhone and Android.
            </p>
          </div>
          <AppDownloadBadges layout="column" />
        </div>
      </section>

      <section className="border-b border-line bg-white/60 px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#a855f7]">
            How it works
          </p>
          <h2 className="mt-3 max-w-2xl text-2xl font-bold sm:text-3xl">
            Three steps from situation to prayer
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.step} className="rounded-2xl border border-line bg-paper p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ccff00]/20 text-lg font-bold text-[#a855f7]">
                  {s.step}
                </span>
                <p className="mt-4 font-bold">{s.title}</p>
                <p className="mt-2 text-sm text-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#a855f7]">
            Features
          </p>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">More than a Bible app — a prayer guide</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {features.map((f) => (
              <article
                key={f.title}
                className="rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:shadow-md sm:p-8"
              >
                <span className="text-3xl">{f.icon}</span>
                <h3 className="mt-4 text-xl font-bold">{f.title}</h3>
                <p className="mt-2 text-muted">{f.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-[#121216] px-4 py-12 text-white sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-[#ccff00]">
                Example
              </p>
              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                &ldquo;I&apos;m anxious about losing my job&rdquo;
              </h2>
              <p className="mt-4 text-white/75">
                PrayerUnlocks returns Philippians 4:6-7 and Isaiah 41:10 with explanations,
                recommends a <em>prayer of release and trust</em>, walks you through how to
                pray, and gives you words to speak aloud — right now.
              </p>
              <Link
                href="/sign-up"
                className="mt-6 inline-block rounded-xl bg-[#ccff00] px-5 py-3 text-sm font-bold text-black"
              >
                Try it free
              </Link>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm">
              <p className="font-semibold text-[#ccff00]">Philippians 4:6-7</p>
              <p className="mt-2 text-white/80 italic">
                &ldquo;Do not be anxious about anything, but in every situation, by prayer
                and petition, with thanksgiving, present your requests to God.&rdquo;
              </p>
              <p className="mt-4 text-white/60">Prayer type: Release and trust</p>
              <p className="mt-2 text-white/80">
                Name your fear → read the verse → pray aloud → sit with God 60 seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-[#1c1c24] to-[#121216] px-4 py-12 text-white sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Simple pricing</h2>
              <p className="mt-4 text-white/75">
                Prayer unlocks are free. Premium adds unlimited AI explanations, partners,
                and church group tools.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/10 p-6 backdrop-blur">
                <p className="font-semibold">Free</p>
                <p className="mt-2 text-3xl font-bold">$0</p>
                <ul className="mt-4 space-y-2 text-sm text-white/75">
                  <li>✓ Situation → Scripture + prayer</li>
                  <li>✓ Daily habits + streaks</li>
                  <li>✓ 1 accountability partner</li>
                  <li>✓ 1 church group</li>
                </ul>
              </div>
              <div className="rounded-2xl bg-[#ccff00]/15 p-6 ring-2 ring-[#ccff00]/40 backdrop-blur">
                <p className="font-semibold text-[#ccff00]">Premium</p>
                <p className="mt-2 text-3xl font-bold">
                  $4.99<span className="text-base font-normal">/mo</span>
                </p>
                <ul className="mt-4 space-y-2 text-sm text-white/75">
                  <li>✓ AI Bible coach (deep explanations)</li>
                  <li>✓ Unlimited partners</li>
                  <li>✓ Lead up to 10 church groups</li>
                  <li>✓ Advanced insights</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Ready to pray your way through it?</h2>
          <p className="mt-4 text-muted">
            Whatever you&apos;re facing today — start with one honest sentence.
          </p>
          <div className="mt-8 flex flex-col items-center gap-6">
            <AppDownloadBadges />
            <WaitlistForm />
          </div>
          <Link
            href="/sign-up"
            className="mt-6 inline-block text-sm font-semibold text-[#a855f7] hover:underline"
          >
            Or create your account now →
          </Link>
        </div>
      </section>

      <footer className="border-t border-line px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted">
            © {new Date().getFullYear()} PrayerUnlocks · prayerunlocks.com
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <AppDownloadBadges theme="light" />
            <div className="flex gap-6 text-sm text-muted">
              <Link href="/dashboard">App</Link>
              <Link href="/sign-in">Sign in</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
