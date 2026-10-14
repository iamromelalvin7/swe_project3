"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { useAuth, type AuthUser } from "@/lib/auth";
import { redirectAfterLogin } from "@/lib/redirect";
import { Field } from "@/components/Field";
import { FormError } from "@/components/States";

type Mode = "signin" | "register";

export function AuthForm({ mode }: { mode: Mode }) {
  const isRegister = mode === "register";
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const tooShort = isRegister && password.length > 0 && password.length < 8;
  const mismatch = isRegister && confirm.length > 0 && confirm !== password;
  const canSubmit = isRegister
    ? fullName && email && phone && password.length >= 8 && confirm === password
    : email && password;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      if (isRegister) {
        // No account exists yet — register only stages it and emails a
        // code. /verify-email is what actually creates it and signs in.
        await apiFetch<{ message: string }>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ fullName, email, phone, password }),
        });
        const params = new URLSearchParams({ email });
        if (redirect) params.set("redirect", redirect);
        router.push(`/verify-email?${params.toString()}`);
      } else {
        const response = await apiFetch<AuthUser>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        auth.login(response);
        // Admins go back to the admin page they came from (or the
        // dashboard); customers mid-purchase go back to cart, checkout or the
        // product; everyone else lands on the storefront.
        router.push(redirectAfterLogin(redirect, response.role));
      }
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setFormError(err.error.message);
        setFieldErrors(err.error.fields ?? {});
      } else {
        setFormError("Something went wrong. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      aria-pressed={showPassword}
      className="link-quiet absolute bottom-2.5 right-0"
    >
      {showPassword ? "Hide" : "Show"}
    </button>
  );

  return (
    <div className="mx-auto max-w-[420px] px-5 py-14 max-[640px]:py-10">
      <h1 className="font-serif text-h2">{isRegister ? "Create account" : "Sign in"}</h1>
      <p className="mb-9 mt-2 text-sm text-grey">
        {isRegister ? "You need an account to hold a piece. Browsing stays open." : "Welcome back."}
      </p>

      <FormError message={formError} />

      <form onSubmit={onSubmit} noValidate>
        {isRegister && (
          <Field label="Full name" error={fieldErrors.fullName}>
            <input
              className={`field-input ${fieldErrors.fullName ? "field-input-error" : ""}`}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              placeholder="Kofi Mensah"
            />
          </Field>
        )}
        <Field label="Email" error={fieldErrors.email}>
          <input
            className={`field-input ${fieldErrors.email ? "field-input-error" : ""}`}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </Field>
        {isRegister && (
          <Field label="Phone number" error={fieldErrors.phone}>
            <input
              className={`field-input font-mono ${fieldErrors.phone ? "field-input-error" : ""}`}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+233"
            />
          </Field>
        )}
        <div className="relative">
          <Field
            label="Password"
            error={fieldErrors.password ?? (tooShort ? "Use at least 8 characters." : undefined)}
            className={isRegister ? "mb-7" : "mb-3"}
          >
            <input
              className={`field-input pr-14 ${fieldErrors.password || tooShort ? "field-input-error" : ""}`}
              type={showPassword ? "text" : "password"}
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isRegister ? "At least 8 characters" : undefined}
            />
          </Field>
          <div className="pointer-events-none absolute inset-x-0 top-[26px] h-[45px] [&>*]:pointer-events-auto">{passwordToggle}</div>
        </div>
        {!isRegister && (
          <div className="mb-7 text-right">
            <Link href="/forgot-password" className="link-quiet">
              Forgot password?
            </Link>
          </div>
        )}
        {isRegister && password.length > 0 && (
          <Field
            label="Confirm password"
            error={mismatch ? "Passwords don't match." : undefined}
            note={!mismatch && confirm.length > 0 ? "Passwords match." : undefined}
          >
            <input
              className={`field-input ${mismatch ? "field-input-error" : ""}`}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your password"
            />
          </Field>
        )}

        <button type="submit" disabled={!canSubmit || submitting} className="btn-primary mt-3 h-[52px] w-full">
          {submitting ? (isRegister ? "Creating account…" : "Signing in…") : isRegister ? "Create account" : "Sign in"}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-grey">
        {isRegister ? "Have an account? " : "New here? "}
        <Link
          href={`${isRegister ? "/login" : "/register"}${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
          className="text-ink underline underline-offset-4 hover:text-grey"
        >
          {isRegister ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
