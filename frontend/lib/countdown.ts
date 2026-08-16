"use client";

import { useEffect, useState } from "react";

/** Live per-line countdown (FR-D8) — ticks client-side, never trusts a stale render. */
export function useCountdown(expiresAt: string) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const secondsLeft = Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
  const expired = secondsLeft <= 0;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formatted = `${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  return { secondsLeft, expired, formatted };
}
