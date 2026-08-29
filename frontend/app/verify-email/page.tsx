"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { useAuth, type AuthUser } from "@/lib/auth";

function VerifyEmailInner() {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const redirect = searchParams.get("redirect");

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const response = await apiFetch<AuthUser>("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });
      auth.login(response);
      router.push(redirect ?? "/products");
    } catch (err) {
      setFormError(err instanceof ApiRequestError ? err.error.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function resendCode() {
    setResending(true);
    setResent(false);
    setFormError(null);
    try {
      await apiFetch("/api/auth/resend-code", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setResent(true);
    } catch (err) {
      setFormError(err instanceof ApiRequestError ? err.error.message : "Could not resend the code.");
    } finally {
      setResending(false);
    }
  }

  return (
    <main>
      <Header />
      <div className="mx-auto max-w-[420px] px-5 py-16">
        <h1 className="font-serif text-[38px]">Verify your email</h1>
        <p className="mb-10 text-sm text-grey">
          We sent a 6-digit code to {email || "your email"}. Enter it below to finish creating your account.
        </p>

        {formError && (
          <div className="mb-6 font-mono text-[11px] uppercase tracking-[0.08em] text-signal">{formError}</div>
        )}
        {resent && (
          <div className="mb-6 font-mono text-[11px] uppercase tracking-[0.08em] text-ink">A new code was sent.</div>
        )}

        <form onSubmit={onSubmit}>
          <div className="mb-7">
            <label className="mb-2.5 block font-mono text-[11px] uppercase tracking-[0.1em] text-grey">
              Verification code
            </label>
            <input
              className="field-input font-mono tracking-[0.3em]"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              maxLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={code.length !== 6 || submitting}
            className="mt-3.5 h-[52px] w-full bg-ink font-mono text-xs uppercase tracking-[0.12em] text-white hover:opacity-[0.86] disabled:cursor-not-allowed disabled:bg-disabled"
          >
            Verify and create account
          </button>
        </form>

        <button
          type="button"
          onClick={resendCode}
          disabled={resending || !email}
          className="mt-6 block w-full text-center font-mono text-[11px] uppercase tracking-[0.1em] text-grey hover:text-ink disabled:opacity-50"
        >
          {resending ? "Sending…" : "Resend code"}
        </button>

        <Link
          href="/register"
          className="mt-3 block w-full text-center font-mono text-[11px] uppercase tracking-[0.1em] text-grey hover:text-ink"
        >
          Wrong email? Start over
        </Link>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}
