"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";

const navItems = [
  { href: "/admin", label: "Overview", icon: "◈" },
  { href: "/admin/users", label: "Users", icon: "◎" },
  { href: "/admin/revenue", label: "Revenue", icon: "$" },
  { href: "/admin/activity", label: "Activity", icon: "↻" },
  { href: "/admin/unlocks", label: "Unlocks", icon: "🔓" },
  { href: "/admin/demand", label: "Demand", icon: "◇" },
];

export function AdminShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper text-ink lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col gap-6 border-r border-moss/15 bg-white/70 p-7 backdrop-blur lg:flex">
        <AdminBrand />
        <AdminNav pathname={pathname} />
        <Link
          href="/dashboard"
          className="mt-auto rounded-xl border border-line px-4 py-3 text-center text-sm font-medium text-muted hover:border-moss hover:text-moss"
        >
          ← Back to app
        </Link>
        <div className="flex items-center gap-3">
          <UserButton />
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-40 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <AdminBrand compact />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded-lg border border-line px-3 py-2 text-sm font-medium"
              aria-expanded={menuOpen}
            >
              Menu
            </button>
            <UserButton />
          </div>
        </div>
        {menuOpen && (
          <nav className="mt-3 flex flex-col gap-1 border-t border-line pt-3">
            {navItems.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-xl px-4 py-3 text-sm font-medium ${
                    active ? "bg-moss/10 text-moss" : "text-muted"
                  }`}
                >
                  {item.icon} {item.label}
                </Link>
              );
            })}
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-medium text-muted"
            >
              ← Back to app
            </Link>
          </nav>
        )}
      </header>

      <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-6 lg:mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-sage">
            Admin dashboard
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted sm:text-base">{subtitle}</p>}
        </header>
        {children}
      </main>
    </div>
  );
}

function AdminBrand({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-ink to-moss text-base font-extrabold text-white lg:h-11 lg:w-11 lg:text-lg">
        A
      </div>
      <div>
        <p className="font-bold">Admin</p>
        {!compact && <span className="text-xs text-muted">PrayerUnlocks</span>}
      </div>
    </div>
  );
}

function AdminNav({ pathname }: { pathname: string }) {
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
              active
                ? "bg-moss/10 text-moss"
                : "text-muted hover:bg-black/5 hover:text-ink"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border p-4 sm:p-6 ${
        accent ? "border-gold/30 bg-gold/10" : "border-line bg-white"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-extrabold text-moss sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </article>
  );
}

export function BarChart({
  data,
  title,
}: {
  title: string;
  data: { label: string; count: number }[];
}) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="rounded-2xl border border-line bg-white p-4 sm:p-6">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-4 flex h-32 items-end justify-between gap-1 sm:gap-2">
        {data.map((day) => (
          <div key={day.label} className="flex min-w-0 flex-1 flex-col items-center">
            <div
              className="w-full max-w-[2.5rem] rounded-t-md bg-moss"
              style={{
                height: `${Math.max(8, (day.count / max) * 96)}px`,
              }}
            />
            <span className="mt-2 text-xs font-semibold text-muted">
              {day.count}
            </span>
            <span className="truncate text-[10px] text-muted">{day.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-paper p-4 sm:p-8">
      <div className="max-w-md rounded-2xl border border-coral/30 bg-coral/5 p-6 text-center sm:p-8">
        <p className="text-lg font-semibold text-coral">Access denied</p>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-xl bg-moss px-6 py-2 text-sm font-semibold text-white"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}

export function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
