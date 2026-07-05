"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardLayout, type DashboardView } from "@/components/dashboard/DashboardLayout";

type Habit = {
  type: string;
  title: string;
  description: string;
  action: string;
  badge: string;
  completed: boolean;
};

type Partner = {
  id: string;
  name: string;
  todayCompleted: number;
};

type Message = { role: string; content: string };

type ChurchGroup = {
  id: string;
  name: string;
  churchName?: string | null;
  inviteCode: string;
  role: "LEADER" | "MEMBER";
  memberCount: number;
  leaderName: string;
  inviteUrl?: string;
};

type GroupMember = {
  id: string;
  name: string;
  role: "LEADER" | "MEMBER";
  todayCompleted: number;
  totalHabits: number;
  completedToday: string[];
  streak: number;
  weeklyConsistency: number;
  needsAttention: boolean;
};

type GroupDashboard = {
  id: string;
  name: string;
  churchName?: string | null;
  inviteCode: string;
  inviteUrl: string;
  isLeader: boolean;
  summary: {
    memberCount: number;
    activeToday: number;
    fullyCompleteToday: number;
    needsAttention: number;
    avgWeeklyConsistency: number;
  };
  weekOverview: { date: string; activeMembers: number }[];
  members: GroupMember[];
};

type View = DashboardView;

export default function DashboardPage() {
  const [view, setView] = useState<View>("today");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [streak, setStreak] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [tier, setTier] = useState("FREE");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [coachInput, setCoachInput] = useState("");
  const [coachLoading, setCoachLoading] = useState(false);
  const [insights, setInsights] = useState<{
    weeklyConsistency: number;
    prayerDays: number;
    nudgesSent: number;
    days: { date: string; completed: string[] }[];
    advancedLocked?: boolean;
  } | null>(null);
  const [churchGroups, setChurchGroups] = useState<ChurchGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupDetails, setGroupDetails] = useState<GroupDashboard | null>(null);
  const [toast, setToast] = useState("");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }, []);

  const loadHabits = useCallback(async () => {
    const res = await fetch("/api/habits");
    if (!res.ok) return;
    const data = await res.json();
    setHabits(data.habits);
    setStreak(data.streak);
    setCompletedCount(data.completedCount);
    setTier(data.tier);
  }, []);

  const loadPartners = useCallback(async () => {
    const res = await fetch("/api/partners");
    if (!res.ok) return;
    const data = await res.json();
    setPartners(data.partners);
    setInviteUrl(data.inviteUrl);
    setInviteCode(data.inviteCode);
  }, []);

  const loadCoach = useCallback(async () => {
    const res = await fetch("/api/coach");
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages);
  }, []);

  const loadInsights = useCallback(async () => {
    const res = await fetch("/api/insights");
    if (!res.ok) return;
    setInsights(await res.json());
  }, []);

  const loadGroups = useCallback(async () => {
    const res = await fetch("/api/groups");
    if (!res.ok) return null;
    const data = await res.json();
    const groups = data.groups ?? [];
    setChurchGroups(groups);
    return groups[0]?.id as string | undefined;
  }, []);

  const loadGroupDetails = useCallback(async (groupId: string) => {
    const res = await fetch(`/api/groups?id=${groupId}`);
    if (!res.ok) return;
    setGroupDetails(await res.json());
  }, []);

  useEffect(() => {
    loadHabits();
    loadPartners();
    loadCoach();
    loadInsights();
    loadGroups().then((firstId) => {
      if (firstId) setSelectedGroupId((prev) => prev ?? firstId);
    });
  }, [loadHabits, loadPartners, loadCoach, loadInsights, loadGroups]);

  useEffect(() => {
    if (selectedGroupId) {
      loadGroupDetails(selectedGroupId);
    }
  }, [selectedGroupId, loadGroupDetails]);

  useEffect(() => {
    async function acceptPendingInvites() {
      const params = new URLSearchParams(window.location.search);
      const res = await fetch("/api/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: params.get("invite") ?? undefined,
          groupCode: params.get("group") ?? undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) showToast(data.message);
        await loadPartners();
        if (params.get("invite") || params.get("group")) {
          window.history.replaceState({}, "", "/dashboard");
        }
      }
    }

    acceptPendingInvites();
  }, [loadPartners, showToast]);

  async function toggleHabit(type: string) {
    const res = await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    if (res.ok) {
      const data = await res.json();
      setStreak(data.streak);
      await loadHabits();
    }
  }

  async function resetToday() {
    await fetch("/api/habits", { method: "DELETE" });
    await loadHabits();
    showToast("Today has been reset.");
  }

  async function sendCoachMessage(question: string) {
    if (!question.trim()) return;
    setCoachLoading(true);
    setMessages((m) => [...m, { role: "user", content: question }]);
    setCoachInput("");

    const res = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } else {
      showToast(data.error ?? "Could not reach coach");
      setMessages((m) => m.slice(0, -1));
    }
    setCoachLoading(false);
  }

  async function nudgePartner(partnerId: string, name: string) {
    const res = await fetch("/api/partners", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnerId, type: "PRAYED_FOR_YOU", message: "I prayed for you 🙏" }),
    });
    if (res.ok) {
      showToast(`Encouragement sent to ${name}`);
      await loadInsights();
    }
  }

  async function addPartner(code: string) {
    const res = await fetch("/api/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: code }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`${data.partner.name} added as partner`);
      await loadPartners();
    } else {
      showToast(data.error ?? "Could not add partner");
    }
  }

  async function upgrade() {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  async function manageBilling() {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "portal" }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      showToast(data.error ?? "No subscription found");
    }
  }

  async function nudgeGroupMember(
    memberId: string,
    name: string,
    type: "PRAYED_FOR_YOU" | "CHECK_IN" = "PRAYED_FOR_YOU",
  ) {
    if (!selectedGroupId) return;
    const messages = {
      PRAYED_FOR_YOU: `I prayed for you today, ${name} 🙏`,
      CHECK_IN: `Hey ${name}, have you walked with God today?`,
    };
    const res = await fetch("/api/groups", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupId: selectedGroupId,
        memberId,
        type,
        message: messages[type],
      }),
    });
    if (res.ok) {
      showToast(`Encouragement sent to ${name}`);
      await loadInsights();
    } else {
      const data = await res.json();
      showToast(data.error ?? "Could not send encouragement");
    }
  }

  async function createGroup(name: string, churchName?: string) {
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, churchName }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`Group "${data.group.name}" created`);
      await loadGroups();
      setSelectedGroupId(data.group.id);
    } else {
      showToast(data.error ?? "Could not create group");
    }
  }

  const percent = habits.length ? Math.round((completedCount / habits.length) * 100) : 0;
  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 18
        ? "Good afternoon"
        : "Good evening";

  return (
    <DashboardLayout
      view={view}
      setView={setView}
      tier={tier}
      onUpgrade={upgrade}
      onManageBilling={manageBilling}
    >
        <section className="mb-6 flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-moss to-sage p-5 text-white sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:rounded-3xl sm:p-8">
          <div className="min-w-0">
            <p className="text-sm text-white/80">
              {new Intl.DateTimeFormat("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              }).format(new Date())}
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Stay consistent with God daily.</h1>
          </div>
          <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center self-start rounded-full bg-white/20 backdrop-blur sm:h-24 sm:w-24">
            <span className="text-2xl font-extrabold sm:text-3xl">{streak}</span>
            <small className="text-xs">day streak</small>
          </div>
        </section>

        {view === "today" && (
          <section>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-sage">
                  Today&apos;s Walk
                </p>
                <h2 className="text-xl font-bold sm:text-2xl">{greeting}</h2>
              </div>
              <button
                type="button"
                onClick={resetToday}
                className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:bg-white"
              >
                Reset
              </button>
            </div>

            <div className="grid gap-4">
              {habits.map((habit) => (
                <article
                  key={habit.type}
                  className={`flex flex-col gap-4 rounded-2xl border p-4 transition sm:flex-row sm:items-center sm:p-5 ${
                    habit.completed
                      ? "border-sage/40 bg-sage/5"
                      : "border-line bg-white"
                  }`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-moss/10 text-sm font-bold text-moss">
                    {habit.badge}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-semibold">{habit.title}</h3>
                    <p className="text-sm text-muted">{habit.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleHabit(habit.type)}
                    className={`w-full rounded-xl px-4 py-2.5 text-sm font-medium sm:w-auto ${
                      habit.completed
                        ? "bg-sage text-white"
                        : "bg-moss text-white hover:bg-moss/90"
                    }`}
                  >
                    {habit.completed ? "Done" : habit.action}
                  </button>
                </article>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between rounded-2xl border border-line bg-white p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-sage">
                  Daily Progress
                </p>
                <h3 className="text-xl font-bold">
                  {completedCount} of {habits.length} completed
                </h3>
              </div>
              <div className="text-3xl font-extrabold text-moss">{percent}%</div>
            </div>
          </section>
        )}

        {view === "coach" && (
          <section>
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-sage">
                AI Bible Coach
              </p>
              <h2 className="text-xl font-bold sm:text-2xl">Ask for clarity, wisdom, or a prayer</h2>
              {tier !== "PREMIUM" && (
                <p className="mt-2 text-sm text-coral">
                  Premium feature — upgrade to unlock full AI coach access.
                </p>
              )}
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {[
                "Explain John 3:16",
                "How do I handle anxiety biblically?",
                "Help me pray for discipline",
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendCoachMessage(prompt)}
                  className="rounded-full border border-line bg-white px-4 py-2 text-sm hover:border-moss"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="mb-4 max-h-96 space-y-4 overflow-y-auto rounded-2xl border border-line bg-white p-6">
              {messages.length === 0 && (
                <p className="text-muted">
                  Hi, I am here for Scripture reflection, prayer prompts, and gentle
                  accountability. What would help you walk faithfully today?
                </p>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`rounded-xl p-4 ${
                    m.role === "user" ? "ml-8 bg-moss/10" : "mr-8 bg-paper"
                  }`}
                >
                  <strong className="block text-xs uppercase text-muted">
                    {m.role === "user" ? "You" : "Coach"}
                  </strong>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{m.content}</p>
                </div>
              ))}
              {coachLoading && <p className="text-sm text-muted">Thinking...</p>}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendCoachMessage(coachInput);
              }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <input
                value={coachInput}
                onChange={(e) => setCoachInput(e.target.value)}
                placeholder="Ask your Bible coach"
                className="min-w-0 flex-1 rounded-xl border border-line px-4 py-3 outline-none focus:border-moss"
              />
              <button
                type="submit"
                disabled={coachLoading}
                className="w-full rounded-xl bg-moss px-6 py-3 font-semibold text-white disabled:opacity-60 sm:w-auto"
              >
                Send
              </button>
            </form>
          </section>
        )}

        {view === "partners" && (
          <section>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-sage">
                  Accountability
                </p>
                <h2 className="text-xl font-bold sm:text-2xl">Walk with people who help you keep going</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(inviteUrl);
                  showToast("Invite link copied!");
                }}
                className="rounded-xl bg-moss px-4 py-2 text-sm font-semibold text-white"
              >
                Invite
              </button>
            </div>

            <p className="mb-4 text-sm text-muted">
              Your invite code: <strong className="text-ink">{inviteCode}</strong>
            </p>

            <div className="mb-6 space-y-3">
              {partners.map((p) => (
                <article
                  key={p.id}
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-line bg-white p-4 sm:p-5"
                >
                  <div className="min-w-0">
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="text-sm text-muted">
                      {p.todayCompleted}/4 habits today
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => nudgePartner(p.id, p.name)}
                    className="w-full rounded-xl border border-moss px-4 py-2 text-sm font-medium text-moss hover:bg-moss/5 sm:w-auto"
                  >
                    Nudge
                  </button>
                </article>
              ))}
              {partners.length === 0 && (
                <p className="text-muted">No partners yet. Share your invite link!</p>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = (e.target as HTMLFormElement).inviteCode as HTMLInputElement;
                addPartner(input.value.trim());
                input.value = "";
              }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <input
                name="inviteCode"
                placeholder="Enter partner invite code"
                className="min-w-0 flex-1 rounded-xl border border-line px-4 py-3 outline-none focus:border-moss"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-moss px-6 py-3 font-semibold text-white sm:w-auto"
              >
                Add Partner
              </button>
            </form>
          </section>
        )}

        {view === "insights" && insights && (
          <section>
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-sage">
                Insights
              </p>
              <h2 className="text-xl font-bold sm:text-2xl">Your consistency snapshot</h2>
            </div>

            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <article className="rounded-2xl border border-line bg-white p-6 text-center">
                <span className="text-3xl font-extrabold text-moss">
                  {insights.weeklyConsistency}%
                </span>
                <p className="mt-1 text-sm text-muted">Weekly consistency</p>
              </article>
              <article className="rounded-2xl border border-line bg-white p-6 text-center">
                <span className="text-3xl font-extrabold text-moss">
                  {insights.prayerDays}
                </span>
                <p className="mt-1 text-sm text-muted">Prayer days this week</p>
              </article>
              <article className="rounded-2xl border border-line bg-white p-6 text-center">
                <span className="text-3xl font-extrabold text-moss">
                  {insights.advancedLocked ? "—" : insights.nudgesSent}
                </span>
                <p className="mt-1 text-sm text-muted">Encouragements sent</p>
              </article>
            </div>

            {insights.advancedLocked ? (
              <div className="rounded-2xl border border-gold/30 bg-gold/10 p-6 text-center">
                <p className="font-semibold text-gold">Advanced insights</p>
                <p className="mt-2 text-sm text-muted">
                  Upgrade to Premium for weekly breakdown and encouragement stats.
                </p>
                <button
                  type="button"
                  onClick={upgrade}
                  className="mt-4 rounded-xl bg-moss px-6 py-2 text-sm font-semibold text-white"
                >
                  Upgrade — $4.99/mo
                </button>
              </div>
            ) : (
            <div className="space-y-3">
              {insights.days.map((day) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between rounded-xl border border-line bg-white px-5 py-3"
                >
                  <span className="text-sm font-medium">
                    {new Intl.DateTimeFormat("en-GB", {
                      weekday: "short",
                      day: "numeric",
                    }).format(new Date(`${day.date}T12:00:00`))}
                  </span>
                  <div className="flex gap-1">
                    {["BIBLE", "PRAYER", "DEVOTIONAL", "ENCOURAGE"].map((type) => (
                      <span
                        key={type}
                        className={`h-3 w-3 rounded-full ${
                          day.completed.includes(type) ? "bg-sage" : "bg-line"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            )}
          </section>
        )}

        {view === "groups" && (
          <section>
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-sage">
                  Church groups
                </p>
                <h2 className="text-xl font-bold sm:text-2xl">Leader dashboard</h2>
                <p className="mt-1 text-sm text-muted">
                  See who walked with God today and send encouragement.
                </p>
              </div>
              {groupDetails?.isLeader && groupDetails.inviteUrl && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(groupDetails.inviteUrl);
                    showToast("Group invite link copied!");
                  }}
                  className="rounded-xl bg-moss px-4 py-2 text-sm font-semibold text-white"
                >
                  Copy invite link
                </button>
              )}
            </div>

            {churchGroups.length > 0 ? (
              <div className="mb-6 flex flex-wrap gap-2">
                {churchGroups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGroupId(g.id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      selectedGroupId === g.id
                        ? "bg-moss text-white"
                        : "border border-line bg-white text-muted hover:border-moss"
                    }`}
                  >
                    {g.name}
                    {g.role === "LEADER" ? " · Leader" : ""}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mb-6 text-muted">
                No church groups yet. Create one for your cell group or small group.
              </p>
            )}

            {groupDetails && (
              <>
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                  <article className="rounded-2xl border border-line bg-white p-5 text-center">
                    <span className="text-2xl font-extrabold text-moss">
                      {groupDetails.summary.activeToday}/{groupDetails.summary.memberCount}
                    </span>
                    <p className="mt-1 text-xs text-muted">Active today</p>
                  </article>
                  <article className="rounded-2xl border border-line bg-white p-5 text-center">
                    <span className="text-2xl font-extrabold text-moss">
                      {groupDetails.summary.fullyCompleteToday}
                    </span>
                    <p className="mt-1 text-xs text-muted">Full walk</p>
                  </article>
                  <article className="rounded-2xl border border-line bg-white p-5 text-center">
                    <span className="text-2xl font-extrabold text-moss">
                      {groupDetails.summary.needsAttention}
                    </span>
                    <p className="mt-1 text-xs text-muted">Need attention</p>
                  </article>
                  <article className="rounded-2xl border border-line bg-white p-5 text-center">
                    <span className="text-2xl font-extrabold text-moss">
                      {groupDetails.summary.avgWeeklyConsistency}%
                    </span>
                    <p className="mt-1 text-xs text-muted">Avg week</p>
                  </article>
                </div>

                <div className="mb-8 rounded-2xl border border-line bg-white p-6">
                  <h3 className="font-semibold">This week</h3>
                  <p className="text-sm text-muted">Members active each day</p>
                  <div className="mt-4 flex h-28 items-end justify-between gap-2">
                    {groupDetails.weekOverview.map((day) => {
                      const max = Math.max(
                        ...groupDetails.weekOverview.map((d) => d.activeMembers),
                        1,
                      );
                      return (
                        <div key={day.date} className="flex flex-1 flex-col items-center">
                          <div
                            className="w-full max-w-[2rem] rounded-t-md bg-moss"
                            style={{
                              height: `${Math.max(8, (day.activeMembers / max) * 72)}px`,
                            }}
                          />
                          <span className="mt-2 text-xs font-semibold text-muted">
                            {day.activeMembers}
                          </span>
                          <span className="text-[10px] text-muted">
                            {new Intl.DateTimeFormat("en-GB", {
                              weekday: "short",
                            }).format(new Date(`${day.date}T12:00:00`))}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  {groupDetails.members.map((member) => (
                    <article
                      key={member.id}
                      className={`rounded-2xl border p-5 ${
                        member.needsAttention
                          ? "border-coral/40 bg-coral/5"
                          : "border-line bg-white"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">
                            {member.name}
                            {member.role === "LEADER" && (
                              <span className="ml-2 rounded bg-moss/10 px-2 py-0.5 text-xs text-moss">
                                Leader
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-muted">
                            {member.todayCompleted}/{member.totalHabits} today ·{" "}
                            {member.streak} day streak · {member.weeklyConsistency}% week
                          </p>
                        </div>
                        {groupDetails.isLeader && member.role !== "LEADER" && (
                          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                            <button
                              type="button"
                              onClick={() =>
                                nudgeGroupMember(member.id, member.name, "PRAYED_FOR_YOU")
                              }
                              className="w-full rounded-xl border border-moss px-3 py-2 text-sm font-medium text-moss hover:bg-moss/5 sm:w-auto"
                            >
                              Prayed for you
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                nudgeGroupMember(member.id, member.name, "CHECK_IN")
                              }
                              className="w-full rounded-xl border border-line px-3 py-2 text-sm font-medium text-muted hover:bg-black/5 sm:w-auto"
                            >
                              Check in
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const name = (form.groupName as HTMLInputElement).value.trim();
                const church = (form.churchName as HTMLInputElement).value.trim();
                if (!name) return;
                createGroup(name, church || undefined);
                form.reset();
              }}
              className="mt-8 flex flex-wrap gap-3 rounded-2xl border border-line bg-white p-5"
            >
              <input
                name="groupName"
                placeholder="New group name"
                className="min-w-[12rem] flex-1 rounded-xl border border-line px-4 py-3 outline-none focus:border-moss"
              />
              <input
                name="churchName"
                placeholder="Church name (optional)"
                className="min-w-[12rem] flex-1 rounded-xl border border-line px-4 py-3 outline-none focus:border-moss"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-moss px-6 py-3 font-semibold text-white sm:w-auto"
              >
                Create group
              </button>
            </form>
          </section>
        )}

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl bg-ink px-6 py-3 text-center text-sm text-white shadow-lg lg:bottom-6">
          {toast}
        </div>
      )}
    </DashboardLayout>
  );
}
