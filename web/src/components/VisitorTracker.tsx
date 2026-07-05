"use client";

import { useEffect } from "react";

export function VisitorTracker() {
  useEffect(() => {
    const key = "pu_page_view";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "page_view", path: "/" }),
    }).catch(() => {});
  }, []);

  return null;
}
