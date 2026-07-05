"use client";

import { useState } from "react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined }),
      });

      if (!res.ok) throw new Error("Failed");
      setStatus("success");
      setEmail("");
      setName("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-moss/20 bg-white/80 p-6 text-center backdrop-blur">
        <p className="text-lg font-semibold text-moss">You&apos;re on the list!</p>
        <p className="mt-2 text-sm text-muted">We&apos;ll email you when PrayerUnlocks launches.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:flex-wrap"
    >
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none focus:border-moss sm:min-w-[10rem] sm:flex-1"
      />
      <input
        type="email"
        required
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none focus:border-moss sm:min-w-[12rem] sm:flex-[2]"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-xl bg-moss px-6 py-3 text-sm font-semibold text-white transition hover:bg-moss/90 disabled:opacity-60 sm:w-auto"
      >
        {status === "loading" ? "Joining..." : "Get Early Access"}
      </button>
      {status === "error" && (
        <p className="w-full text-sm text-coral">Something went wrong. Try again.</p>
      )}
    </form>
  );
}
