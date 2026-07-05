"use client";

import { useEffect, useState } from "react";
import {
  AdminErrorState,
  AdminShell,
  formatDate,
} from "@/components/admin/AdminShell";

type ActivityData = {
  events: {
    id: string;
    type: string;
    path: string | null;
    metadata: string | null;
    createdAt: string;
    user: { email: string; name: string } | null;
  }[];
  unlocks: {
    id: string;
    situation: string;
    prayerType: string | null;
    createdAt: string;
    user: { email: string; name: string };
  }[];
  nudges: {
    id: string;
    type: string;
    message: string;
    createdAt: string;
    fromUser: { name: string; email: string };
    toUser: { name: string; email: string };
  }[];
};

const eventLabels: Record<string, string> = {
  page_view: "Page view",
  sign_up: "Sign up",
  unlock: "Prayer unlock",
  coach: "AI coach",
  habit_complete: "Habit completed",
  waitlist: "Waitlist signup",
  checkout_started: "Checkout started",
  subscription_active: "Subscription active",
  subscription_cancelled: "Subscription cancelled",
};

type Tab = "events" | "unlocks" | "nudges";

export default function AdminActivityPage() {
  const [data, setData] = useState<ActivityData | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("events");

  useEffect(() => {
    fetch("/api/admin/activity")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Could not load activity");
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
        Loading activity…
      </div>
    );
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "events", label: "All events", count: data.events.length },
    { id: "unlocks", label: "Unlocks", count: data.unlocks.length },
    { id: "nudges", label: "Nudges", count: data.nudges.length },
  ];

  return (
    <AdminShell
      title="Visitor & user activity"
      subtitle="Real-time interaction feed"
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "bg-moss text-white"
                : "border border-line bg-white text-muted hover:border-moss"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {tab === "events" && (
        <div className="rounded-2xl border border-line bg-white divide-y divide-line">
          {data.events.map((event) => {
            const meta = event.metadata
              ? (JSON.parse(event.metadata) as Record<string, unknown>)
              : null;
            return (
              <div key={event.id} className="px-5 py-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {eventLabels[event.type] ?? event.type}
                      {event.path && (
                        <span className="ml-2 text-muted">· {event.path}</span>
                      )}
                    </p>
                    <p className="text-muted">
                      {event.user?.email ?? "Visitor (anonymous)"}
                    </p>
                    {meta && (
                      <p className="mt-1 text-xs text-muted">
                        {Object.entries(meta)
                          .map(([k, v]) => `${k}: ${String(v)}`)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted">
                    {formatDate(event.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
          {data.events.length === 0 && (
            <p className="px-5 py-8 text-center text-muted">No events yet.</p>
          )}
        </div>
      )}

      {tab === "unlocks" && (
        <div className="rounded-2xl border border-line bg-white divide-y divide-line">
          {data.unlocks.map((unlock) => (
            <div key={unlock.id} className="px-5 py-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{unlock.user.email}</p>
                  {unlock.prayerType && (
                    <p className="text-xs text-sage">{unlock.prayerType}</p>
                  )}
                  <p className="mt-2 text-muted line-clamp-2">
                    {unlock.situation}
                  </p>
                </div>
                <p className="text-xs text-muted">
                  {formatDate(unlock.createdAt)}
                </p>
              </div>
            </div>
          ))}
          {data.unlocks.length === 0 && (
            <p className="px-5 py-8 text-center text-muted">No unlocks yet.</p>
          )}
        </div>
      )}

      {tab === "nudges" && (
        <div className="rounded-2xl border border-line bg-white divide-y divide-line">
          {data.nudges.map((nudge) => (
            <div key={nudge.id} className="px-5 py-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {nudge.fromUser.name} → {nudge.toUser.name}
                  </p>
                  <p className="text-xs text-muted">{nudge.type}</p>
                  <p className="mt-1 text-muted">{nudge.message}</p>
                </div>
                <p className="text-xs text-muted">
                  {formatDate(nudge.createdAt)}
                </p>
              </div>
            </div>
          ))}
          {data.nudges.length === 0 && (
            <p className="px-5 py-8 text-center text-muted">No nudges yet.</p>
          )}
        </div>
      )}
    </AdminShell>
  );
}
