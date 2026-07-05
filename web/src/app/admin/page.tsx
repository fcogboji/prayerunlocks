"use client";

import { useEffect, useState } from "react";
import {
  AdminErrorState,
  AdminShell,
  BarChart,
  StatCard,
  formatDate,
  formatUsd,
} from "@/components/admin/AdminShell";

type Overview = {
  generatedAt: string;
  users: {
    total: number;
    premium: number;
    free: number;
    newWeek: number;
    newMonth: number;
    conversionRate: number;
  };
  revenue: { mrrUsd: number; arrUsd: number; premiumPriceUsd: number };
  engagement: {
    unlocksToday: number;
    unlocksWeek: number;
    pageViewsWeek: number;
    habitsWeek: number;
    coachMessagesWeek: number;
    nudgesWeek: number;
    groupsCount: number;
    waitlistCount: number;
  };
  charts: {
    unlocks: { label: string; count: number }[];
    signups: { label: string; count: number }[];
    pageViews: { label: string; count: number }[];
  };
  recentSignups: {
    id: string;
    name: string;
    email: string;
    tier: string;
    createdAt: string;
  }[];
};

export default function AdminOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/overview")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Could not load admin data");
        }
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <AdminErrorState message={error} />;
  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Loading admin dashboard…
      </div>
    );
  }

  return (
    <AdminShell
      title="Reports overview"
      subtitle={`Updated ${formatDate(data.generatedAt)}`}
    >
      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={data.users.total} hint={`${data.users.newWeek} this week`} />
        <StatCard
          label="Premium subscribers"
          value={data.users.premium}
          hint={`${data.users.conversionRate}% conversion`}
          accent
        />
        <StatCard label="MRR" value={formatUsd(data.revenue.mrrUsd)} hint={`ARR ${formatUsd(data.revenue.arrUsd)}`} accent />
        <StatCard label="Waitlist" value={data.engagement.waitlistCount} hint="Landing signups" />
      </section>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Unlocks today" value={data.engagement.unlocksToday} />
        <StatCard label="Unlocks (7d)" value={data.engagement.unlocksWeek} />
        <StatCard label="Page views (7d)" value={data.engagement.pageViewsWeek} />
        <StatCard label="Habits completed (7d)" value={data.engagement.habitsWeek} />
      </section>

      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Coach messages (7d)" value={data.engagement.coachMessagesWeek} />
        <StatCard label="Nudges sent (7d)" value={data.engagement.nudgesWeek} />
        <StatCard label="Church groups" value={data.engagement.groupsCount} />
      </section>

      <section className="mb-8 grid gap-6 lg:grid-cols-3">
        <BarChart title="Unlocks — last 7 days" data={data.charts.unlocks} />
        <BarChart title="Signups — last 7 days" data={data.charts.signups} />
        <BarChart title="Landing views — last 7 days" data={data.charts.pageViews} />
      </section>

      <section className="rounded-2xl border border-line bg-white p-6">
        <h3 className="font-semibold">Recent signups</h3>
        <div className="mt-4 divide-y divide-line">
          {data.recentSignups.map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{user.name || "Unnamed"}</p>
                <p className="text-muted">{user.email}</p>
              </div>
              <div className="text-right">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    user.tier === "PREMIUM"
                      ? "bg-gold/20 text-gold"
                      : "bg-moss/10 text-moss"
                  }`}
                >
                  {user.tier}
                </span>
                <p className="mt-1 text-xs text-muted">
                  {formatDate(user.createdAt)}
                </p>
              </div>
            </div>
          ))}
          {data.recentSignups.length === 0 && (
            <p className="py-4 text-sm text-muted">No signups yet.</p>
          )}
        </div>
      </section>
    </AdminShell>
  );
}
