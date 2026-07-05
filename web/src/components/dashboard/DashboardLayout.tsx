"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export type DashboardView = "today" | "coach" | "partners" | "insights" | "groups";

const NAV_ITEMS: { id: DashboardView; label: string; shortLabel: string; icon: string }[] = [
  { id: "today", label: "Today", shortLabel: "Today", icon: "☀" },
  { id: "coach", label: "Coach", shortLabel: "Coach", icon: "✦" },
  { id: "partners", label: "Partners", shortLabel: "People", icon: "＋" },
  { id: "groups", label: "Groups", shortLabel: "Groups", icon: "⛪" },
  { id: "insights", label: "Insights", shortLabel: "Stats", icon: "◷" },
];

type DashboardLayoutProps = {
  view: DashboardView;
  setView: (view: DashboardView) => void;
  tier: string;
  onUpgrade: () => void;
  onManageBilling: () => void;
  children: React.ReactNode;
};

export function DashboardLayout({
  view,
  setView,
  tier,
  onUpgrade,
  onManageBilling,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper text-ink lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col gap-7 border-r border-moss/15 bg-white/70 p-7 backdrop-blur lg:flex">
        <Brand />
        <DesktopNav view={view} setView={setView} />
        <Link
          href="/admin"
          className="rounded-xl border border-line px-4 py-2 text-center text-xs font-medium text-muted hover:border-moss hover:text-moss"
        >
          Admin dashboard
        </Link>
        <UpgradeCard tier={tier} onUpgrade={onUpgrade} onManageBilling={onManageBilling} />
        <div className="flex items-center gap-3">
          <UserButton />
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line/80 bg-paper/95 px-4 py-3 backdrop-blur lg:hidden">
        <Brand compact />
        <div className="flex items-center gap-2">
          {tier !== "PREMIUM" && (
            <button
              type="button"
              onClick={onUpgrade}
              className="rounded-lg bg-moss px-3 py-1.5 text-xs font-semibold text-white"
            >
              Upgrade
            </button>
          )}
          <UserButton />
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 pb-24 sm:px-6 sm:py-6 lg:p-8 lg:pb-8">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        aria-label="Main navigation"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-between">
          {NAV_ITEMS.map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={`flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium sm:text-xs ${
                  active ? "text-moss" : "text-muted"
                }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span className="truncate">{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function Brand({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-moss to-sage text-base font-extrabold text-white lg:h-11 lg:w-11 lg:text-lg">
        PU
      </div>
      <div className={compact ? "min-w-0" : undefined}>
        <p className="truncate font-bold">PrayerUnlocks</p>
        {!compact && (
          <span className="text-xs text-muted">Scripture & prayer for every situation</span>
        )}
      </div>
    </div>
  );
}

function DesktopNav({
  view,
  setView,
}: {
  view: DashboardView;
  setView: (view: DashboardView) => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setView(item.id)}
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
            view === item.id
              ? "bg-moss/10 text-moss"
              : "text-muted hover:bg-black/5 hover:text-ink"
          }`}
        >
          <span>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}

function UpgradeCard({
  tier,
  onUpgrade,
  onManageBilling,
}: {
  tier: string;
  onUpgrade: () => void;
  onManageBilling: () => void;
}) {
  return (
    <div className="mt-auto rounded-2xl border border-gold/30 bg-gold/10 p-4">
      <span className="text-xs font-semibold uppercase tracking-wider text-gold">
        {tier === "PREMIUM" ? "Premium" : "Upgrade"}
      </span>
      <strong className="mt-1 block text-sm">
        {tier === "PREMIUM" ? "Full access unlocked" : "AI coach, unlimited partners"}
      </strong>
      {tier !== "PREMIUM" ? (
        <button
          type="button"
          onClick={onUpgrade}
          className="mt-3 w-full rounded-xl bg-moss py-2 text-sm font-semibold text-white"
        >
          $4.99/month
        </button>
      ) : (
        <button
          type="button"
          onClick={onManageBilling}
          className="mt-3 w-full rounded-xl border border-moss py-2 text-sm font-semibold text-moss"
        >
          Manage billing
        </button>
      )}
    </div>
  );
}
