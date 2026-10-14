"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Field } from "@/components/Field";
import { FormError } from "@/components/States";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { useAuth, type AuthUser } from "@/lib/auth";
import { safeRedirect } from "@/lib/redirect";

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
      router.push(safeRedirect(redirect));
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
      setFormError(err instanceof ApiRequestError ? err.error.message : "Couldn't resend the code. Try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[420px] px-5 py-14 max-[640px]:py-10">
        <h1 className="font-serif text-h2">Verify your email</h1>
        <p className="mb-9 mt-2 text-sm text-grey">
          We sent a 6-digit code to {email ? <span className="text-ink">{email}</span> : "your email"}. Enter it below to finish
          creating your account.
        </p>

        <FormError message={formError} />
        {resent && (
          <p role="status" className="mb-6 border-l-2 border-ink py-1 pl-3.5 text-sm text-ink">
            A new code is on its way.
          </p>
        )}

        <form onSubmit={onSubmit}>
          <Field label="Verification code">
            <input
              className="field-input font-mono text-lg tracking-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
            />
          </Field>

          <button type="submit" disabled={code.length !== 6 || submitting} className="btn-primary mt-3 h-[52px] w-full">
            {submitting ? "Verifying…" : "Verify and create account"}
          </button>
        </form>

        <div className="mt-7 flex flex-col items-center gap-3">
          <button type="button" onClick={resendCode} disabled={resending || !email} className="link-quiet disabled:opacity-50">
            {resending ? "Sending…" : "Resend code"}
          </button>
          <Link href="/register" className="link-quiet">
            Wrong email? Start over
          </Link>
        </div>
      </main>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}
