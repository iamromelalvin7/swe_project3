"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { apiFetch, ApiRequestError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      // Always the same outcome regardless of whether the email has an
      // account — the backend never reveals that either.
      setSent(true);
    } catch (err) {
      setFormError(err instanceof ApiRequestError ? err.error.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <Header />
      <div className="mx-auto max-w-[420px] px-5 py-16">
        <h1 className="font-serif text-[38px]">Reset your password</h1>

        {sent ? (
          <p className="mb-10 text-sm text-grey">
            If {email} has an account, we sent a link to reset the password. Follow it to choose a new one.
          </p>
        ) : (
          <>
            <p className="mb-10 text-sm text-grey">Enter your email and we&apos;ll send a link to reset your password.</p>

            {formError && (
              <div className="mb-6 font-mono text-[11px] uppercase tracking-[0.08em] text-signal">{formError}</div>
            )}

            <form onSubmit={onSubmit}>
              <div className="mb-7">
                <label className="mb-2.5 block font-mono text-[11px] uppercase tracking-[0.1em] text-grey">Email</label>
                <input
                  className="field-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={!email || submitting}
                className="mt-3.5 h-[52px] w-full bg-ink font-mono text-xs uppercase tracking-[0.12em] text-white hover:opacity-[0.86] disabled:cursor-not-allowed disabled:bg-disabled"
              >
                Send reset link
              </button>
            </form>
          </>
        )}

        <Link
          href="/login"
          className="mt-6 block w-full text-center font-mono text-[11px] uppercase tracking-[0.1em] text-grey hover:text-ink"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
