"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Field } from "@/components/Field";
import { FormError } from "@/components/States";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { useAuth, type AuthUser } from "@/lib/auth";
import { redirectAfterLogin } from "@/lib/redirect";

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
      router.push(redirectAfterLogin(null, response.role));
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
        {!token ? (
          <div className="text-center">
            <h1 className="font-serif text-h2">Reset your password</h1>
            <p className="mb-7 mt-3 text-sm text-grey">This link is missing its token. Request a new one.</p>
            <Link href="/forgot-password" className="link-underline">
              Request a reset link →
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-serif text-h2">Choose a new password</h1>
            <p className="mb-9 mt-2 text-sm text-grey">Make it something you haven&apos;t used here before.</p>

            <FormError message={formError} />

            <form onSubmit={onSubmit}>
              <Field label="New password" error={tooShort ? "Use at least 8 characters." : undefined}>
                <input
                  className={`field-input ${tooShort ? "field-input-error" : ""}`}
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </Field>

              {password.length > 0 && (
                <Field
                  label="Confirm password"
                  error={mismatch ? "Passwords don't match." : undefined}
                  note={!mismatch && confirm.length > 0 ? "Passwords match." : undefined}
                >
                  <input
                    className={`field-input ${mismatch ? "field-input-error" : ""}`}
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat your password"
                  />
                </Field>
              )}

              <button type="submit" disabled={!canSubmit || submitting} className="btn-primary mt-3 h-[52px] w-full">
                {submitting ? "Saving…" : "Reset password"}
              </button>
            </form>
          </>
        )}
      </main>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  );
}
