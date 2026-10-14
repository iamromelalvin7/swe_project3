"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Field } from "@/components/Field";
import { FormError } from "@/components/States";
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
    <>
      <Header />
      <main className="mx-auto max-w-[420px] px-5 py-14 max-[640px]:py-10">
        <h1 className="font-serif text-h2">Reset your password</h1>

        {sent ? (
          <p role="status" className="mb-9 mt-2 text-sm text-grey">
            If <span className="text-ink">{email}</span> has an account, we&apos;ve sent a link to reset the password. Follow it to
            choose a new one.
          </p>
        ) : (
          <>
            <p className="mb-9 mt-2 text-sm text-grey">Enter your email and we&apos;ll send a link to reset your password.</p>

            <FormError message={formError} />

            <form onSubmit={onSubmit}>
              <Field label="Email">
                <input
                  className="field-input"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </Field>

              <button type="submit" disabled={!email || submitting} className="btn-primary mt-3 h-[52px] w-full">
                {submitting ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </>
        )}

        <div className="mt-7 text-center">
          <Link href="/login" className="link-quiet">
            ← Back to sign in
          </Link>
        </div>
      </main>
    </>
  );
}
