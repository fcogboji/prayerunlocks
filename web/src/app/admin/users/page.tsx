"use client";

import { useEffect, useState } from "react";
import {
  AdminErrorState,
  AdminShell,
  formatDate,
} from "@/components/admin/AdminShell";

type UserRow = {
  id: string;
  name: string;
  email: string;
  tier: string;
  createdAt: string;
  stripeSubscriptionId: string | null;
  _count: {
    habits: number;
    unlockRequests: number;
    chatMessages: number;
    sentNudges: number;
  };
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/users?page=${page}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Could not load users");
        }
        return res.json();
      })
      .then((data) => {
        setUsers(data.users);
        setPages(data.pages);
        setTotal(data.total);
      })
      .catch((e) => setError(e.message));
  }, [page]);

  if (error) return <AdminErrorState message={error} />;

  return (
    <AdminShell
      title="Users"
      subtitle={`${total} registered accounts`}
    >
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line bg-paper/80 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-5 py-4">User</th>
              <th className="px-5 py-4">Tier</th>
              <th className="px-5 py-4">Unlocks</th>
              <th className="px-5 py-4">Habits</th>
              <th className="px-5 py-4">Coach</th>
              <th className="px-5 py-4">Nudges</th>
              <th className="px-5 py-4">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-paper/50">
                <td className="px-5 py-4">
                  <p className="font-medium">{user.name || "—"}</p>
                  <p className="text-muted">{user.email}</p>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      user.tier === "PREMIUM"
                        ? "bg-gold/20 text-gold"
                        : "bg-moss/10 text-moss"
                    }`}
                  >
                    {user.tier}
                  </span>
                </td>
                <td className="px-5 py-4">{user._count.unlockRequests}</td>
                <td className="px-5 py-4">{user._count.habits}</td>
                <td className="px-5 py-4">{user._count.chatMessages}</td>
                <td className="px-5 py-4">{user._count.sentNudges}</td>
                <td className="px-5 py-4 text-muted">
                  {formatDate(user.createdAt)}
                </td>
              </tr>
            ))}
            {users.length === 0 && !error && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-muted">
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-xl border border-line px-4 py-2 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-muted">
            Page {page} of {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border border-line px-4 py-2 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </AdminShell>
  );
}
