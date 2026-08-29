"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { useAuth, type AuthUser } from "@/lib/auth";

function ResetPasswordInner() {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const tooShort = password.length > 0 && password.length < 8;
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = token && password.length >= 8 && confirm === password;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const response = await apiFetch<AuthUser>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword: password }),
      });
      auth.login(response);
      router.push("/products");
    } catch (err) {
      setFormError(err instanceof ApiRequestError ? err.error.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <main>
        <Header />
        <div className="mx-auto max-w-[420px] px-5 py-16 text-center">
          <h1 className="mb-6 font-serif text-[38px]">Reset your password</h1>
          <p className="mb-6 text-sm text-grey">This link is missing its token. Request a new one.</p>
          <Link
            href="/forgot-password"
            className="font-mono text-[11px] uppercase tracking-[0.1em] text-grey hover:text-ink"
          >
            Request a reset link
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      <Header />
      <div className="mx-auto max-w-[420px] px-5 py-16">
        <h1 className="font-serif text-[38px]">Choose a new password</h1>
        <p className="mb-10 text-sm text-grey">Make it something you haven&apos;t used here before.</p>

        {formError && (
          <div className="mb-6 font-mono text-[11px] uppercase tracking-[0.08em] text-signal">{formError}</div>
        )}

        <form onSubmit={onSubmit}>
          <div className="mb-7">
            <label className="mb-2.5 block font-mono text-[11px] uppercase tracking-[0.1em] text-grey">New password</label>
            <input
              className="field-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
            {tooShort && (
              <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-signal">At least 8 characters</div>
            )}
          </div>

          {password.length > 0 && (
            <div className="mb-7">
              <label className="mb-2.5 block font-mono text-[11px] uppercase tracking-[0.1em] text-grey">
                Confirm password
              </label>
              <input
                className="field-input"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
              />
              {mismatch && (
                <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-signal">Passwords do not match</div>
              )}
              {!mismatch && confirm.length > 0 && (
                <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ink">Passwords match</div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="mt-3.5 h-[52px] w-full bg-ink font-mono text-xs uppercase tracking-[0.12em] text-white hover:opacity-[0.86] disabled:cursor-not-allowed disabled:bg-disabled"
          >
            Reset password
          </button>
        </form>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  );
}
