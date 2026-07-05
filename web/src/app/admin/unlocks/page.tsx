"use client";

import { useEffect, useState } from "react";
import {
  AdminErrorState,
  AdminShell,
  StatCard,
  formatDate,
} from "@/components/admin/AdminShell";

type UnlockInsights = {
  weekCount: number;
  prayerTypes: { prayerType: string | null; _count: number }[];
  recent: {
    id: string;
    situation: string;
    prayerType: string | null;
    createdAt: string;
    user: { name: string; email: string };
  }[];
};

export default function AdminUnlocksPage() {
  const [data, setData] = useState<UnlockInsights | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/unlocks")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Could not load unlock insights");
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
        Loading unlock insights…
      </div>
    );
  }

  const maxTypeCount = Math.max(
    ...data.prayerTypes.map((t) => t._count),
    1,
  );

  return (
    <AdminShell
      title="Prayer unlock insights"
      subtitle="What situations people are bringing and which prayer types fit"
    >
      <section className="mb-8">
        <StatCard
          label="Unlocks this week"
          value={data.weekCount}
          hint="Core product usage"
        />
      </section>

      <section className="mb-8 rounded-2xl border border-line bg-white p-6">
        <h3 className="font-semibold">Prayer types (last 30 days)</h3>
        <div className="mt-4 space-y-3">
          {data.prayerTypes.map((row) => (
            <div key={row.prayerType ?? "unknown"}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{row.prayerType ?? "Unknown"}</span>
                <span className="text-muted">{row._count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-moss"
                  style={{
                    width: `${(row._count / maxTypeCount) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
          {data.prayerTypes.length === 0 && (
            <p className="text-sm text-muted">No unlock data yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-6">
        <h3 className="font-semibold">Recent situations</h3>
        <div className="mt-4 divide-y divide-line">
          {data.recent.map((unlock) => (
            <div key={unlock.id} className="py-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{unlock.user.email}</p>
                  {unlock.prayerType && (
                    <span className="mt-1 inline-block rounded-full bg-sage/15 px-2 py-0.5 text-xs text-moss">
                      {unlock.prayerType}
                    </span>
                  )}
                  <p className="mt-2 text-muted">{unlock.situation}</p>
                </div>
                <p className="text-xs text-muted">
                  {formatDate(unlock.createdAt)}
                </p>
              </div>
            </div>
          ))}
          {data.recent.length === 0 && (
            <p className="py-4 text-sm text-muted">No unlocks yet.</p>
          )}
        </div>
      </section>
    </AdminShell>
  );
}
