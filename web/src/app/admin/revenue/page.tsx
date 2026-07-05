"use client";

import { useEffect, useState } from "react";
import {
  AdminErrorState,
  AdminShell,
  StatCard,
  formatDate,
  formatUsd,
} from "@/components/admin/AdminShell";

type RevenueData = {
  mrrUsd: number;
  arrUsd: number;
  activeSubscriptions: number;
  subscribers: {
    id: string;
    name: string;
    email: string;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    updatedAt: string;
    createdAt: string;
  }[];
  recentBillingEvents: {
    id: string;
    type: string;
    createdAt: string;
    user: { email: string; name: string } | null;
    metadata: Record<string, unknown> | null;
  }[];
};

const eventLabels: Record<string, string> = {
  checkout_started: "Checkout started",
  subscription_active: "Subscription active",
  subscription_cancelled: "Subscription cancelled",
};

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/revenue")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Could not load revenue data");
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
        Loading revenue…
      </div>
    );
  }

  return (
    <AdminShell
      title="Revenue"
      subtitle="Stripe subscriptions at $4.99/month"
    >
      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="MRR" value={formatUsd(data.mrrUsd)} accent />
        <StatCard label="ARR" value={formatUsd(data.arrUsd)} />
        <StatCard
          label="Active subscriptions"
          value={data.activeSubscriptions}
        />
      </section>

      <section className="mb-8 rounded-2xl border border-line bg-white p-6">
        <h3 className="font-semibold">Active subscribers</h3>
        <div className="mt-4 divide-y divide-line">
          {data.subscribers.map((sub) => (
            <div
              key={sub.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{sub.name || "—"}</p>
                <p className="text-muted">{sub.email}</p>
              </div>
              <p className="text-xs text-muted">
                Since {formatDate(sub.createdAt)}
              </p>
            </div>
          ))}
          {data.subscribers.length === 0 && (
            <p className="py-4 text-sm text-muted">No active subscribers yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-6">
        <h3 className="font-semibold">Billing events</h3>
        <div className="mt-4 divide-y divide-line">
          {data.recentBillingEvents.map((event) => (
            <div
              key={event.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {eventLabels[event.type] ?? event.type}
                </p>
                <p className="text-muted">
                  {event.user?.email ?? "Anonymous"}
                </p>
              </div>
              <p className="text-xs text-muted">
                {formatDate(event.createdAt)}
              </p>
            </div>
          ))}
          {data.recentBillingEvents.length === 0 && (
            <p className="py-4 text-sm text-muted">No billing events yet.</p>
          )}
        </div>
      </section>
    </AdminShell>
  );
}
