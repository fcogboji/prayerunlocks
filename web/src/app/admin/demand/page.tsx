"use client";

import { useEffect, useState } from "react";
import {
  AdminErrorState,
  AdminShell,
  StatCard,
  formatDate,
} from "@/components/admin/AdminShell";

type DemandData = {
  weekCount: number;
  monthCount: number;
  topKeywords: { word: string; count: number }[];
  topPrayerTypes: { prayerType: string; count: number }[];
  topVerses: { reference: string; count: number }[];
  recentRequests: {
    id: string;
    situation: string;
    prayerType: string | null;
    verses: string[];
    createdAt: string;
    user: { name: string; email: string };
  }[];
};

function RankedBars({
  title,
  hint,
  items,
  labelKey,
}: {
  title: string;
  hint?: string;
  items: { count: number }[];
  labelKey: (item: (typeof items)[number]) => string;
}) {
  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <section className="rounded-2xl border border-line bg-white p-6">
      <h3 className="font-semibold">{title}</h3>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={labelKey(item)}>
            <div className="mb-1 flex justify-between gap-3 text-sm">
              <span className="font-medium">{labelKey(item)}</span>
              <span className="shrink-0 text-muted">{item.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-moss"
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted">No data yet for this period.</p>
        )}
      </div>
    </section>
  );
}

export default function AdminDemandPage() {
  const [data, setData] = useState<DemandData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/demand")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Could not load demand insights");
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
        Loading demand insights…
      </div>
    );
  }

  return (
    <AdminShell
      title="What users are looking for"
      subtitle="Prayer requests, themes, and Bible verses — last 30 days"
    >
      <section className="mb-8 grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Prayer requests this week"
          value={data.weekCount}
        />
        <StatCard
          label="Prayer requests this month"
          value={data.monthCount}
          hint="Situations users brought to unlock"
        />
      </section>

      <section className="mb-8 grid gap-6 lg:grid-cols-3">
        <RankedBars
          title="Common themes"
          hint="Keywords from user situations"
          items={data.topKeywords}
          labelKey={(item) => (item as DemandData["topKeywords"][number]).word}
        />
        <RankedBars
          title="Prayer types requested"
          hint="How users are being guided to pray"
          items={data.topPrayerTypes}
          labelKey={(item) =>
            (item as DemandData["topPrayerTypes"][number]).prayerType
          }
        />
        <RankedBars
          title="Most recommended verses"
          hint="Scripture surfaced most often"
          items={data.topVerses}
          labelKey={(item) =>
            (item as DemandData["topVerses"][number]).reference
          }
        />
      </section>

      <section className="rounded-2xl border border-line bg-white p-6">
        <h3 className="font-semibold">Recent prayer requests</h3>
        <p className="mt-1 text-sm text-muted">
          What users typed in, the prayer type returned, and verses given
        </p>
        <div className="mt-4 divide-y divide-line">
          {data.recentRequests.map((request) => (
            <article key={request.id} className="py-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{request.user.email}</p>
                  <p className="mt-2 text-ink">{request.situation}</p>
                  {request.prayerType && (
                    <p className="mt-2">
                      <span className="rounded-full bg-sage/15 px-2 py-0.5 text-xs font-medium text-moss">
                        {request.prayerType}
                      </span>
                    </p>
                  )}
                  {request.verses.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {request.verses.map((verse) => (
                        <span
                          key={verse}
                          className="rounded-lg border border-line bg-paper px-2 py-1 text-xs text-muted"
                        >
                          {verse}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <p className="shrink-0 text-xs text-muted">
                  {formatDate(request.createdAt)}
                </p>
              </div>
            </article>
          ))}
          {data.recentRequests.length === 0 && (
            <p className="py-4 text-sm text-muted">
              No prayer requests yet. Data appears when users use Prayer Unlock.
            </p>
          )}
        </div>
      </section>
    </AdminShell>
  );
}
