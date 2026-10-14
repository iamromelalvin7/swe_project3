"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth";

/**
 * Admin-page guard: sends anyone who isn't a signed-in admin to sign in,
 * returning them to `returnTo` afterwards. Returns the admin user once
 * known, otherwise null (still loading, or being redirected).
 */
export function useAdmin(returnTo: string) {
  const { ready, user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (ready && !isAdmin) {
      router.push(`/login?redirect=${encodeURIComponent(returnTo)}`);
    }
  }, [ready, isAdmin, returnTo, router]);

  return isAdmin ? user : null;
}
